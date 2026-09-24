import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:4000";

import fs from "fs";

async function executeViaLocalLoginRunner(): Promise<any> {
  const scriptPath = path.join(process.cwd(), "backend", "login_runner.js");
  const backendCwd = path.join(process.cwd(), "backend");

  if (!fs.existsSync(scriptPath) || !fs.existsSync(backendCwd)) {
    return {
      success: false,
      error:
        "1-Click Auto-Detect is only available when running PrepForge locally on your computer. On the cloud deployment, please copy and paste your LEETCODE_SESSION cookie manually below.",
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
              "1-Click Auto-Detect is only available when running PrepForge locally on your computer. Please paste your LEETCODE_SESSION cookie manually below.",
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
          reject(new Error(stderr || `Login runner exited with code ${code}`));
        } else {
          resolve({ success: false, error: stderr || "Login failed without output" });
        }
      });
    } catch (err: any) {
      resolve({
        success: false,
        error:
          "1-Click Auto-Detect is only available when running PrepForge locally. Please paste your LEETCODE_SESSION cookie manually below.",
      });
    }
  });
}

export async function POST() {
  try {
    // Try backend HTTP service first if running
    let data: any = null;
    try {
      const res = await fetch(`${BACKEND_URL}/api/leetcode/login`, {
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
      data = await executeViaLocalLoginRunner();
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js LeetCode Login Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to launch LeetCode login window",
      },
      { status: 500 }
    );
  }
}
