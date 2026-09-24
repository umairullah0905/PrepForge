import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:4000";

const LEETCODE_LANG_MAP: Record<string, string> = {
  python: "python3",
  python3: "python3",
  javascript: "javascript",
  typescript: "typescript",
  cpp: "cpp",
  "c++": "cpp",
  java: "java",
};

function detectEffectiveLanguage(code: string, declaredLang: string): string {
  if (!code) return declaredLang || "python3";
  const trimmed = code.trim();

  // Obvious C++ patterns on LeetCode
  if (
    trimmed.includes("vector<") ||
    trimmed.includes("std::") ||
    trimmed.includes("unordered_map<") ||
    trimmed.includes("unordered_set<") ||
    trimmed.includes("ListNode*") ||
    trimmed.includes("TreeNode*") ||
    (trimmed.includes("class Solution") && trimmed.includes("public:")) ||
    trimmed.includes("#include")
  ) {
    return "cpp";
  }

  // Obvious Java patterns on LeetCode
  if (
    trimmed.includes("public int") ||
    trimmed.includes("public boolean") ||
    trimmed.includes("public void") ||
    trimmed.includes("public String") ||
    trimmed.includes("public List<") ||
    trimmed.includes("int[]") ||
    trimmed.includes("String[]") ||
    trimmed.includes("HashMap<") ||
    trimmed.includes("System.out")
  ) {
    return "java";
  }

  // Obvious Python patterns on LeetCode
  if (
    (trimmed.includes("def ") && trimmed.includes("self")) ||
    (trimmed.includes("class Solution:") && !trimmed.includes("{")) ||
    trimmed.includes("elif ") ||
    /def\s+[a-zA-Z0-9_]+\s*\(\s*self/.test(trimmed)
  ) {
    return "python3";
  }

  // Obvious TypeScript / JavaScript patterns on LeetCode
  if (
    trimmed.includes("function(") ||
    trimmed.includes("function (") ||
    trimmed.includes("console.log(") ||
    (trimmed.includes("var ") && !trimmed.includes("class Solution"))
  ) {
    if (/:\s*(number|string|boolean|void|number\[\])/.test(trimmed)) {
      return "typescript";
    }
    return "javascript";
  }

  return declaredLang || "python3";
}

async function submitDirectToLeetCode({
  slug,
  language,
  code,
  sessionCookie,
  questionId,
}: {
  slug: string;
  language: string;
  code: string;
  sessionCookie: string;
  questionId: string;
}): Promise<any> {
  const cleanSession = sessionCookie.trim();

  // Step 1: GraphQL query to obtain questionId & fresh csrftoken cookie
  let csrfToken = "";
  try {
    const gqlRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Origin: "https://leetcode.com",
        Referer: `https://leetcode.com/problems/${slug}/`,
      },
      body: JSON.stringify({
        query: `query q($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId } }`,
        variables: { titleSlug: slug },
      }),
    });

    const setCookies = gqlRes.headers.getSetCookie
      ? gqlRes.headers.getSetCookie()
      : [gqlRes.headers.get("set-cookie") || ""];

    for (const c of setCookies) {
      const match = c.match(/csrftoken=([^;]+)/);
      if (match) {
        csrfToken = match[1];
        break;
      }
    }

    if (gqlRes.ok) {
      const gqlData = await gqlRes.json();
      if (gqlData?.data?.question?.questionId) {
        questionId = gqlData.data.question.questionId;
      }
    }
  } catch (err: any) {
    console.warn("Failed to get questionId from GraphQL:", err.message);
  }

  if (!csrfToken) {
    csrfToken = Math.random().toString(36).substring(2, 18);
  }

  const effectiveLang = detectEffectiveLanguage(code, language);
  const langSlug =
    LEETCODE_LANG_MAP[(effectiveLang || language || "").toLowerCase()] ||
    "python3";

  // Step 2: Post submission
  const submitUrl = `https://leetcode.com/problems/${slug}/submit/`;
  const submitRes = await fetch(submitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Origin: "https://leetcode.com",
      Referer: `https://leetcode.com/problems/${slug}/`,
      "x-csrftoken": csrfToken,
      Cookie: `csrftoken=${csrfToken}; LEETCODE_SESSION=${cleanSession};`,
    },
    body: JSON.stringify({
      question_id: questionId || "1",
      lang: langSlug,
      typed_code: code,
    }),
  });

  const submitText = await submitRes.text();
  let submitData: any = null;
  try {
    submitData = JSON.parse(submitText);
  } catch (_) {}

  if (
    submitRes.status === 403 ||
    submitData?.error === "User is not authenticated" ||
    (typeof submitData?.error === "string" &&
      submitData.error.toLowerCase().includes("authenticate"))
  ) {
    return {
      success: false,
      error:
        "LeetCode session expired or invalid. Please re-copy your LEETCODE_SESSION cookie and paste it in the modal.",
      needsAuth: true,
    };
  }

  if (!submitRes.ok || !submitData?.submission_id) {
    return {
      success: false,
      error:
        submitData?.error ||
        `LeetCode submit returned status ${submitRes.status}: ${submitText.slice(0, 150)}`,
    };
  }

  const submissionId = submitData.submission_id;

  // Step 3: Poll for verdict (up to 25 seconds)
  let verdict: any = null;
  for (let attempt = 0; attempt < 16; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const checkRes = await fetch(
        `https://leetcode.com/submissions/detail/${submissionId}/check/`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Referer: `https://leetcode.com/problems/${slug}/`,
            Cookie: `csrftoken=${csrfToken}; LEETCODE_SESSION=${cleanSession};`,
          },
        }
      );

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData && checkData.state === "SUCCESS") {
          verdict = checkData;
          break;
        }
      }
    } catch (_) {}
  }

  if (!verdict) {
    return {
      success: false,
      error: "Submission timed out while waiting for LeetCode judge.",
    };
  }

  const isAccepted = verdict.status_msg === "Accepted";

  return {
    success: true,
    submissionId,
    isAccepted,
    statusMsg: verdict.status_msg,
    totalCorrect: verdict.total_correct ?? 0,
    totalTestcases: verdict.total_testcases ?? 0,
    runtime: verdict.status_runtime || null,
    runtimePercentile: verdict.runtime_percentile
      ? `${verdict.runtime_percentile.toFixed(1)}%`
      : null,
    memory: verdict.status_memory || null,
    memoryPercentile: verdict.memory_percentile
      ? `${verdict.memory_percentile.toFixed(1)}%`
      : null,
    compileError: verdict.full_compile_error || null,
    runtimeError: verdict.full_runtime_error || null,
    lastTestcase: verdict.last_testcase || null,
    expectedOutput: verdict.expected_output || null,
    codeOutput: verdict.code_output || null,
  };
}

async function executeViaLocalRunner(payload: any): Promise<any> {
  const scriptPath = path.join(process.cwd(), "backend", "submit_runner.js");
  const backendCwd = path.join(process.cwd(), "backend");

  if (!fs.existsSync(scriptPath) || !fs.existsSync(backendCwd)) {
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const child = spawn(process.execPath, [scriptPath], {
        cwd: backendCwd,
        env: {
          ...process.env,
          NODE_PATH: path.join(backendCwd, "node_modules"),
        },
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err: any) => {
        reject(err);
      });

      child.on("close", (code) => {
        if (stdout.trim()) {
          try {
            const parsed = JSON.parse(stdout);
            return resolve(parsed);
          } catch (e) {
            // ignore json parse error
          }
        }
        if (code !== 0) {
          reject(new Error(stderr || `Runner process exited with code ${code}`));
        } else {
          resolve({ success: false, error: stderr || "Submission failed without output" });
        }
      });

      child.stdin?.write(JSON.stringify(payload));
      child.stdin?.end();
    } catch (err) {
      resolve(null);
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, language, code, sessionCookie } = body;

    if (!slug || !code) {
      return NextResponse.json({ error: "Problem slug and code are required." }, { status: 400 });
    }

    if (!sessionCookie) {
      return NextResponse.json(
        {
          error: "Missing LEETCODE_SESSION cookie. Please connect your LeetCode account to submit.",
          needsAuth: true,
        },
        { status: 401 }
      );
    }

    // 1. Fetch numeric questionId for the problem from LeetCode GraphQL
    let questionId = "1";
    try {
      const gqlRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query q($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId } }`,
          variables: { titleSlug: slug },
        }),
      });
      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        questionId = gqlData.data?.question?.questionId || "1";
      }
    } catch (_) {}

    const payload = {
      slug,
      language,
      code,
      sessionCookie,
      questionId,
    };

    // 2. Try Backend HTTP Service first (if configured/running locally)
    let data: any = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/leetcode/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        data = await res.json();
      }
    } catch (err: any) {
      // Backend server not listening -> fallback to direct submission
    }

    // 3. Fallback to direct HTTP submission (works seamlessly in Cloud Run)
    if (!data) {
      data = await submitDirectToLeetCode(payload);
    }

    // 4. Optional fallback to local runner if direct failed and runner exists on disk
    if ((!data || !data.success) && fs.existsSync(path.join(process.cwd(), "backend", "submit_runner.js"))) {
      try {
        const runnerData = await executeViaLocalRunner(payload);
        if (runnerData) data = runnerData;
      } catch (_) {}
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js LeetCode Submit Route Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to submit to LeetCode",
      },
      { status: 500 }
    );
  }
}
