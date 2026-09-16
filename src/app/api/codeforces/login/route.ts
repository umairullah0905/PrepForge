import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:4000";

async function executeViaLocalCfLoginRunner(): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "backend", "cf_login_runner.js");
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
        reject(new Error(stderr || `CF Login runner exited with code ${code}`));
      } else {
        resolve({ success: false, error: stderr || "Login failed without output" });
      }
    });
  });
}

export async function POST() {
  try {
    // Try backend HTTP service first if running
    let data: any = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/codeforces/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        data = await res.json();
      }
    } catch (err: any) {
      // Backend server not listening
    }

    // Fallback to local runner
    if (!data) {
      data = await executeViaLocalCfLoginRunner();
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js Codeforces Login Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to launch Codeforces login window",
      },
      { status: 500 }
    );
  }
}
