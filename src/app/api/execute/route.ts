import { NextResponse } from "next/server";

const PISTON_URL = process.env.PISTON_URL || "http://127.0.0.1:2000/api/v2/execute";

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
  javascript: {
    pistonLang: "javascript",
    version: "18.15.0",
    filename: "solution.js",
  },
  typescript: {
    pistonLang: "typescript",
    version: "5.0.3",
    filename: "solution.ts",
  },
  cpp: {
    pistonLang: "c++",
    version: "10.2.0",
    filename: "main.cpp",
  },
  java: {
    pistonLang: "java",
    version: "15.0.2",
    filename: "Solution.java",
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
      const pistonPayload = {
        language: config.pistonLang,
        version: "*",
        files: [{ name: config.filename, content: code }],
        stdin: stdin || "",
        run_timeout: 4000,
        compile_timeout: 8000,
      };

      const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pistonPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Piston execution failed: ${errText || res.statusText}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      const stdout = data.run?.stdout || "";
      const stderr = data.run?.stderr || data.compile?.stderr || "";

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
            executionTime: data.run?.time,
          },
        ],
      });
    }

    // Case 2: Run multiple test cases
    const results: ExecutionResult[] = [];
    let compileError = "";

    for (const test of testCases as TestCase[]) {
      const pistonPayload = {
        language: config.pistonLang,
        version: "*",
        files: [{ name: config.filename, content: code }],
        stdin: (test.input || "").trim(),
        run_timeout: 4000,
        compile_timeout: 8000,
      };

      const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pistonPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Execution sandbox error: ${errText || res.statusText}` },
          { status: 502 }
        );
      }

      const data = await res.json();

      // Check for compilation errors (e.g. C++, Java)
      if (data.compile?.stderr) {
        compileError = data.compile.stderr;
        results.push({
          input: test.input || "",
          expected: test.expectedOutput,
          actual: "",
          passed: false,
          stderr: compileError,
        });
        break;
      }

      const stdout = (data.run?.stdout || "").trim();
      const stderr = (data.run?.stderr || "").trim();
      const expected = (test.expectedOutput || "").trim();

      // Comparison logic: normalize line endings and trim whitespace
      const normalizedActual = stdout.replace(/\r\n/g, "\n");
      const normalizedExpected = expected.replace(/\r\n/g, "\n");
      const passed = expected.length > 0 ? normalizedActual === normalizedExpected : !stderr;

      results.push({
        input: test.input || "",
        expected: test.expectedOutput,
        actual: stdout,
        passed,
        stderr,
        executionTime: data.run?.time,
      });

      // If runtime exception / fatal crash occurred, break early
      if (stderr && data.run?.code !== 0) {
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
        error:
          error.code === "ECONNREFUSED"
            ? "Piston Docker sandbox is not running. Please ensure the container is started on port 2000."
            : error.message || "Internal server error during execution",
      },
      { status: 500 }
    );
  }
}
