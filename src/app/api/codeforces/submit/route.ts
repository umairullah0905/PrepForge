import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:4000";

import fs from "fs";

async function executeViaLocalCfRunner(payload: any): Promise<any> {
  const scriptPath = path.join(process.cwd(), "backend", "cf_submit_runner.js");
  const backendCwd = path.join(process.cwd(), "backend");

  if (!fs.existsSync(scriptPath) || !fs.existsSync(backendCwd)) {
    return {
      success: false,
      error:
        "Codeforces automated submission is only available when running locally on your computer with the local backend active.",
    };
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
        if (err.code === "ENOENT") {
          resolve({
            success: false,
            error:
              "Codeforces submission runner was not found on this server. Please run locally or configure the backend service.",
          });
        } else {
          reject(err);
        }
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
          reject(new Error(stderr || `CF Runner process exited with code ${code}`));
        } else {
          resolve({ success: false, error: stderr || "Submission failed without output" });
        }
      });

      child.stdin?.write(JSON.stringify(payload));
      child.stdin?.end();
    } catch (err: any) {
      resolve({
        success: false,
        error: "Failed to launch Codeforces runner process.",
      });
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problemCode, contestId, problemIndex, language, code, sessionCookies, handle } = body;

    if (!problemCode && (!contestId || !problemIndex)) {
      return NextResponse.json({ error: "Problem code (e.g. 1985A) is required." }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (!sessionCookies) {
      return NextResponse.json(
        {
          error: "Missing Codeforces session. Please connect your Codeforces account to submit.",
          needsAuth: true,
        },
        { status: 401 }
      );
    }

    const payload = {
      problemCode,
      contestId,
      problemIndex,
      language,
      code,
      sessionCookies,
      handle,
    };

    // Try backend HTTP service first, fallback to direct local runner
    let data: any = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/codeforces/submit`, {
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
        console.log("Backend server not reachable on port 4000; executing via local CF runner...");
        data = await executeViaLocalCfRunner(payload);
      } else {
        throw err;
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js Codeforces Submit Route Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to submit to Codeforces",
      },
      { status: 500 }
    );
  }
}
