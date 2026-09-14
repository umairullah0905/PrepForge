import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:4000";

async function executeViaLocalRunner(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "backend", "submit_runner.js");
    const child = spawn(process.execPath, [scriptPath], {
      cwd: path.join(process.cwd(), "backend"),
      env: {
        ...process.env,
        NODE_PATH: path.join(process.cwd(), "backend", "node_modules"),
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
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

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
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

    // 2. Try Backend HTTP Service first, fallback to direct local runner if not running
    let data: any = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/leetcode/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Backend service error: ${errText || res.statusText}` },
          { status: res.status }
        );
      }

      data = await res.json();
    } catch (err: any) {
      const isConnRefused =
        err?.code === "ECONNREFUSED" ||
        err?.cause?.code === "ECONNREFUSED" ||
        (err?.message && err.message.includes("fetch failed"));

      if (isConnRefused) {
        console.log("Backend server not reachable on port 4000; executing via local runner...");
        data = await executeViaLocalRunner(payload);
      } else {
        throw err;
      }
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
