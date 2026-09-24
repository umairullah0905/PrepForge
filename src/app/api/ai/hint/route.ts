import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

interface HintRequestBody {
  problemTitle: string;
  problemDifficulty?: string;
  problemDescription?: string;
  userCode?: string;
  language?: string;
  hintLevel?: number; // 1: Intuition, 2: Algorithm, 3: Edge cases, 4: Pseudocode
  customPrompt?: string;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<pre[^>]*>/gi, "\n```\n")
    .replace(/<\/pre>/gi, "\n```\n")
    .replace(/<code[^>]*>/gi, "`")
    .replace(/<\/code>/gi, "`")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim()
    .slice(0, 3500);
}

function trimCode(code?: string): string {
  if (!code) return "";
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim()
    .slice(0, 3000);
}

function cleanModelResponse(text: string): string {
  if (!text) return "";
  // 1. Strip complete <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // 2. Strip unclosed <think> tag if model was cut off inside thinking
  if (cleaned.includes("<think>")) {
    cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "").trim();
  }
  // 3. Strip any stray internal meta-dialogue if present at start
  cleaned = cleaned
    .replace(/^(The user wants|I need to|Thinking Process:|Thought:)[\s\S]*?\n\n/i, "")
    .trim();

  // 4. Ensure code blocks are properly closed if cut off
  const fenceMatches = cleaned.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    cleaned += "\n```";
  }

  return cleaned;
}

const getCandidateModels = () => {
  const custom = process.env.OPENROUTER_MODEL?.trim();
  const models = [
    custom,
    "qwen/qwen3.8-27b:free",
    "openrouter/free",
    "cohere/north-mini-code:free",
    "google/gemma-4-26b-a4b-it:free",
  ].filter(Boolean) as string[];
  return Array.from(new Set(models));
};

async function callOpenRouterApi(
  apiKey: string,
  promptText: string,
  systemInstruction: string,
  maxTokens: number = 1500
) {
  let lastError: Error | null = null;
  const candidateModels = getCandidateModels();

  for (const model of candidateModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://prepforge.umair786ullah.workers.dev",
          "X-Title": "PrepForge AI Coach",
        },
        signal: AbortSignal.timeout(25000), // 25s timeout per candidate model
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            {
              role: "user",
              content: promptText,
            },
          ],
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorText =
          errorData?.error?.message || (await response.text().catch(() => response.statusText));

        lastError = new Error(`OpenRouter model ${model} error (${response.status}): ${errorText}`);
        console.warn(`[OpenRouter Fallback] Model ${model} failed (${response.status}): ${errorText}. Trying next model...`);
        continue;
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const rawText = choice?.message?.content?.trim() || "";
      const cleanedText = cleanModelResponse(rawText);

      if (cleanedText) {
        return cleanedText;
      }

      // If response was empty after cleaning, try next model
      lastError = new Error(`Model ${model} returned empty response`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[OpenRouter Fallback] Exception with model ${model}: ${err.message}. Trying next model...`);
    }
  }

  throw lastError || new Error("Failed to generate response from OpenRouter API");
}

export async function POST(request: Request) {
  try {
    // 1. Strictly enforce authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please sign in to use PrepForge AI Coach.",
          isAuthRequired: true,
        },
        { status: 401 }
      );
    }

    // 2. Strictly verify that user has is_premium = true
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_premium) {
      return NextResponse.json(
        {
          success: false,
          error:
            "PrepForge AI Coach is exclusively available for PRO members. Upgrade to PRO to unlock Socratic AI hints and code reviews.",
          isPremiumRequired: true,
        },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env.local file or set it in your deployment environment variables.",
          isConfigError: true,
        },
        { status: 200 }
      );
    }

    const body: HintRequestBody = await request.json();
    const {
      problemTitle,
      problemDifficulty = "Medium",
      problemDescription = "",
      userCode = "",
      language = "python",
      hintLevel = 1,
      customPrompt,
    } = body;

    const cleanDescription = stripHtml(problemDescription);
    const compactCode = trimCode(userCode);

    const systemInstruction = `You are "PrepForge AI Coach", an elite, encouraging DSA interview mentor.
Your mission is to guide students with clear, focused, and actionable Socratic hints that ALWAYS finish cleanly.

CRITICAL RULES:
1. Direct Output Only: Output ONLY the student-facing hint in clean Markdown. NEVER output thinking tags (<think>), chain-of-thought, internal scratchpads, or meta-talk (e.g. "The user wants..."). Begin immediately with the structured hint.
2. Complete & Crisp (100-130 words): Be punchy so you NEVER run out of generation tokens. NEVER cut off mid-thought or mid-sentence. Always finish your final sentence completely with proper punctuation.
3. Socratic Clues: Provide actionable directional guidance without giving away the full code solution (except Hint 4 scaffold).
4. Clean Formatting: Use bolding, short bullet points, and inline code formatting (\`variable\`, \`O(N)\`). Avoid mathematical proofs or long derivations.
5. Language Context: ${language}.`;

    let promptText = "";
    let maxTokens = 1500;

    if (customPrompt && customPrompt.trim()) {
      maxTokens = 1500;
      promptText = `Problem: ${problemTitle} (${problemDifficulty})
Problem Summary: ${cleanDescription}
${compactCode ? `Student's Code (${language}):\n\`\`\`${language}\n${compactCode}\n\`\`\`\n` : ""}
Question: "${customPrompt.trim()}"

Provide a crisp, direct answer (under 120 words). If debugging, pinpoint the bug and give a 1-sentence fix hint. Always finish your response completely.`;
    } else {
      switch (hintLevel) {
        case 1:
          maxTokens = 1500;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Problem Summary: ${cleanDescription}

Task: Hint 1 — Pattern & Core Intuition.
Provide:
1. **Mental Model**: Exactly 1 vivid sentence to visualize the core problem.
2. **Optimal Pattern**: 1-2 concise bullet points on the best pattern/data structure and why brute-force fails.
3. **The "Aha!" Insight**: 1 sentence on the single breakthrough observation.
Keep strictly under 120 words. End with a complete sentence.`;
          break;

        case 2:
          maxTokens = 1500;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Problem Summary: ${cleanDescription}

Task: Hint 2 — Algorithmic Blueprint.
Provide:
1. **Core Steps**: 3-4 numbered sequential steps to solve it.
2. **State & Invariants**: Pointers or variables to track.
3. **Decision Rule**: The exact condition that triggers state updates.
Keep strictly under 130 words. End with a complete sentence.`;
          break;

        case 3:
          maxTokens = 1500;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Problem Summary: ${cleanDescription}
${compactCode ? `Student's Code (${language}):\n\`\`\`${language}\n${compactCode}\n\`\`\`\n` : ""}

Task: Hint 3 — Edge Cases & Complexity.
Provide:
1. **Key Traps**: 2-3 critical edge cases (e.g. empty inputs, duplicates, overflow, boundary values).
2. **Target Complexity**: Expected Time and Space complexity in 1 line.
3. **Code Tip** (if code provided): The bottleneck or bug to watch for.
Keep strictly under 120 words. End with a complete sentence.`;
          break;

        case 4:
        default:
          maxTokens = 1800;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Problem Summary: ${cleanDescription}
${compactCode ? `Student's Code (${language}):\n\`\`\`${language}\n${compactCode}\n\`\`\`\n` : ""}

Task: Hint 4 — Scaffold in ${language}.
Provide:
1. **Clean Skeleton**: Function signature, base case guards, and \`// TODO:\` comments outlining the core logic.
2. **1-Sentence Summary**: How the components link together.
Keep brief (under 25 lines of skeleton). Always close all code blocks (\`\`\`).`;
          break;
      }
    }

    const hint = await callOpenRouterApi(apiKey, promptText, systemInstruction, maxTokens);

    return NextResponse.json({
      success: true,
      hint,
      level: hintLevel,
    });
  } catch (error: any) {
    console.error("OpenRouter AI Hint Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate hint from OpenRouter AI.",
      },
      { status: 500 }
    );
  }
}
