import { NextResponse } from "next/server";
import { executeCodeLocal } from "@/lib/local_runner";

export const runtime = "nodejs";

function getPistonEndpoint(): string {
  const raw = (process.env.PISTON_URL || "http://127.0.0.1:2000").trim();
  if (raw.endsWith("/api/v2/execute")) {
    return raw;
  }
  const base = raw.replace(/\/+$/, "");
  return `${base}/api/v2/execute`;
}

// Map friendly language names to Piston language identifiers and file names
const LANGUAGE_CONFIG: Record<
  string,
  { pistonLang: string; version?: string; filename: string }
> = {
  python: {
    pistonLang: "python",
    version: "3.10.0",
    filename: "solution.py",
  },
  cpp: {
    pistonLang: "c++",
    version: "17",
    filename: "main.cpp",
  },
  "c++": {
    pistonLang: "c++",
    version: "17",
    filename: "main.cpp",
  },
};

export interface TestCase {
  id?: string | number;
  input: string;
  expectedOutput?: string;
}

export interface ExecutionResult {
  input: string;
  expected?: string;
  actual: string;
  passed: boolean | null;
  stderr: string;
  executionTime?: number;
}

async function executeSingleCase(
  language: string,
  code: string,
  stdin: string,
  config: { pistonLang: string; filename: string }
): Promise<{ stdout: string; stderr: string; compileError?: string; time?: number }> {
  const pistonPayload = {
    language: config.pistonLang,
    version: "*",
    files: [{ name: config.filename, content: code }],
    stdin: stdin || "",
    run_timeout: 4000,
    compile_timeout: 8000,
  };

  try {
    const endpoint = getPistonEndpoint();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        stdout: data.run?.stdout || "",
        stderr: data.run?.stderr || data.compile?.stderr || "",
        compileError: data.compile?.stderr || undefined,
        time: data.run?.time,
      };
    }
  } catch (err: any) {
    // Port 2000 not reachable -> execute directly via local runner
  }

  const localRes = await executeCodeLocal(language, code, stdin, 5000);
  return {
    stdout: localRes.stdout,
    stderr: localRes.stderr,
    compileError: localRes.compileError,
    time: localRes.time,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language, code, testCases, stdin } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Code cannot be empty" }, { status: 400 });
    }

    if (!language || !LANGUAGE_CONFIG[language.toLowerCase()]) {
      return NextResponse.json(
        { error: `Unsupported language. Allowed: ${Object.keys(LANGUAGE_CONFIG).join(", ")}` },
        { status: 400 }
      );
    }

    const config = LANGUAGE_CONFIG[language.toLowerCase()];

    // Case 1: Custom one-off run with provided stdin
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      const { stdout, stderr, time } = await executeSingleCase(
        language,
        code,
        stdin || "",
        config
      );

      return NextResponse.json({
        success: true,
        isCustomRun: true,
        allPassed: !stderr,
        results: [
          {
            input: stdin || "",
            actual: stdout,
            stderr,
            passed: !stderr,
            executionTime: time,
          },
        ],
      });
    }

    // Case 2: Run multiple test cases
    const results: ExecutionResult[] = [];
    let compileError = "";

    for (const test of testCases as TestCase[]) {
      const rawInput = (test.input || "").trim();
      const { stdout, stderr, compileError: compErr, time } = await executeSingleCase(
        language,
        code,
        rawInput,
        config
      );

      if (compErr) {
        compileError = compErr;
        results.push({
          input: test.input || "",
          expected: test.expectedOutput,
          actual: "",
          passed: false,
          stderr: compileError,
        });
        break;
      }

      const trimmedStdout = (stdout || "").trim();
      const trimmedStderr = (stderr || "").trim();
      const expected = (test.expectedOutput || "").trim();

      const normalizedActual = trimmedStdout.replace(/\r\n/g, "\n");
      const normalizedExpected = expected.replace(/\r\n/g, "\n");
      const passed = expected.length > 0 ? normalizedActual === normalizedExpected : !trimmedStderr;

      results.push({
        input: test.input || "",
        expected: test.expectedOutput,
        actual: trimmedStdout,
        passed,
        stderr: trimmedStderr,
        executionTime: time,
      });

      if (trimmedStderr && passed === false) {
        break;
      }
    }

    const allPassed =
      results.length === testCases.length && results.every((r) => r.passed === true);

    return NextResponse.json({
      success: true,
      allPassed,
      results,
      compileError: compileError || null,
    });
  } catch (error: any) {
    console.error("Execute API Handler Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error during execution",
      },
      { status: 500 }
    );
  }
}
