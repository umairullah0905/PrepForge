import { NextResponse } from "next/server";

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
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ") // drop heavy preformatted example blocks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900); // compact context (~200 tokens)
}

function trimCode(code?: string): string {
  if (!code) return "";
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  
];

async function callGeminiApi(
  apiKey: string,
  promptText: string,
  systemInstruction: string,
  maxTokens: number = 450
) {
  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If model not found or deprecated, try next model
        if (response.status === 404 || response.status === 400) {
          lastError = new Error(`Model ${model} error: ${errorText}`);
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        return generatedText;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API");
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file or set it in your deployment environment variables.",
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

    const systemInstruction = `You are "PrepForge AI Coach", an elite DSA interview coach. Guide students Socratically.
Rules:
1. NEVER output complete copy-paste solution.
2. Be concise, dense, and structured (<140 words).
3. Use Markdown bullets and inline code (\`code\`).
4. Language context: ${language}.`;

    let promptText = "";
    let maxTokens = 400;

    if (customPrompt && customPrompt.trim()) {
      maxTokens = 450;
      promptText = `Problem: ${problemTitle} (${problemDifficulty})
Summary: ${cleanDescription}
${compactCode ? `User Code in ${language}:\n\`\`\`${language}\n${compactCode}\n\`\`\`` : ""}
Question: "${customPrompt.trim()}"
Provide a concise Socratic hint or debugging suggestion. Max 140 words.`;
    } else {
      switch (hintLevel) {
        case 1:
          maxTokens = 350;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Summary: ${cleanDescription}
Task: Hint 1 (Pattern & Intuition).
- State the best algorithmic pattern / data structure & why (2 concise bullets).
- 1-sentence mental analogy.
No code. Under 100 words.`;
          break;

        case 2:
          maxTokens = 400;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Summary: ${cleanDescription}
Task: Hint 2 (Algorithm).
- 3-4 sequential steps.
- Key state variables to track.
- State transition rule.
No full code. Under 140 words.`;
          break;

        case 3:
          maxTokens = 350;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Summary: ${cleanDescription}
${compactCode ? `User Code:\n\`\`\`${language}\n${compactCode}\n\`\`\`` : ""}
Task: Hint 3 (Edge cases & Complexity).
- 3 critical edge cases / traps.
- Target Time & Space complexity.
Under 120 words.`;
          break;

        case 4:
        default:
          maxTokens = 500;
          promptText = `Problem: ${problemTitle} (${problemDifficulty})
Summary: ${cleanDescription}
${compactCode ? `User Code:\n\`\`\`${language}\n${compactCode}\n\`\`\`` : ""}
Task: Hint 4 (Scaffold in ${language}).
- Minimal skeleton with function signature, base cases, and TODO comments for student's logic.
Keep brief.`;
          break;
      }
    }

    const hint = await callGeminiApi(apiKey, promptText, systemInstruction, maxTokens);

    return NextResponse.json({
      success: true,
      hint,
      level: hintLevel,
    });
  } catch (error: any) {
    console.error("Gemini AI Hint Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate hint from Gemini AI.",
      },
      { status: 500 }
    );
  }
}
