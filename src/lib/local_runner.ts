import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface LocalRunResult {
  stdout: string;
  stderr: string;
  code: number;
  time: number;
  compileError?: string;
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  stdinInput: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; code: number; time: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isTimedOut = false;

    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, LANG: "C.UTF-8" },
      shell: process.platform === "win32",
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        child.kill();
      } catch (_) {}
    }, timeoutMs);

    if (stdinInput && child.stdin) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
      if (stdout.length > 150000) {
        try { child.kill(); } catch (_) {}
      }
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 50000) {
        try { child.kill(); } catch (_) {}
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      if (isTimedOut) {
        resolve({
          stdout,
          stderr: "Time Limit Exceeded (Execution timed out)",
          code: 124,
          time: executionTime,
        });
      } else {
        resolve({
          stdout,
          stderr,
          code: code ?? 0,
          time: executionTime,
        });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: err.message || "Process execution error",
        code: 1,
        time: Date.now() - startTime,
      });
    });
  });
}

export async function executeCodeLocal(
  language: string,
  code: string,
  stdin: string = "",
  timeoutMs: number = 5000
): Promise<LocalRunResult> {
  const lang = language.toLowerCase();
  let tempDir = "";
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "interviewos-run-"));
  } catch (err: any) {
    return {
      stdout: "",
      stderr: "Failed to create temp directory: " + err.message,
      code: 1,
      time: 0,
    };
  }

  try {
    if (lang === "python" || lang === "py" || lang === "python3") {
      let runCode = code;
      // Auto-harness for LeetCode "function only" Solution class
      if (code.includes("class Solution") && !code.includes("sys.stdin") && !code.includes("__main__")) {
        runCode += `\n
import sys, json, ast

def _run_leetcode_harness():
    sol = Solution()
    methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if not methods:
        return
    fn = getattr(sol, methods[0])
    raw = sys.stdin.read().strip()
    if not raw:
        return
    args = []
    try:
        args = json.loads('[' + raw + ']')
    except Exception:
        lines = [l.strip() for l in raw.split('\\n') if l.strip()]
        for l in lines:
            try:
                args.append(ast.literal_eval(l))
            except Exception:
                args.append(l)
    res = fn(*args)
    if isinstance(res, bool):
        print(str(res).lower())
    elif isinstance(res, (list, dict)):
        print(json.dumps(res, separators=(',', '')))
    else:
        print(res)

if __name__ == '__main__':
    _run_leetcode_harness()
`;
      }

      const filePath = path.join(tempDir, "solution.py");
      fs.writeFileSync(filePath, runCode);
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      const res = await runProcess(pythonCmd, ["solution.py"], tempDir, stdin, timeoutMs);
      return res;

    } else if (lang === "javascript" || lang === "js" || lang === "node" || lang === "typescript" || lang === "ts") {
      let runCode = code;
      const fnMatch = code.match(/(?:var|let|const|function)\s+([a-zA-Z0-9_$]+)/);
      const fnName = fnMatch ? fnMatch[1] : "";
      if (!code.includes("readFileSync") && (code.includes("class Solution") || fnName)) {
        runCode += `\n
const _fs = require('fs');
const _raw = _fs.readFileSync(0, 'utf-8').trim();
if (_raw) {
    let _args = [];
    try {
        _args = JSON.parse('[' + _raw + ']');
    } catch(e) {
        _args = _raw.split('\\n').filter(l => l.trim()).map(l => {
            try { return JSON.parse(l); } catch(_) { return l; }
        });
    }
    let _fn = null;
    if (typeof Solution !== 'undefined') {
        const _sol = new Solution();
        const _methods = Object.getOwnPropertyNames(Object.getPrototypeOf(_sol)).filter(m => m !== 'constructor');
        if (_methods.length > 0) _fn = _sol[_methods[0]].bind(_sol);
    }
    ${fnName ? `if (!_fn && typeof ${fnName} === 'function') _fn = ${fnName};` : ""}
    if (_fn) {
        const _res = _fn(..._args);
        if (typeof _res === 'object' && _res !== null) {
            console.log(JSON.stringify(_res));
        } else {
            console.log(_res);
        }
    }
}
`;
      }

      const filePath = path.join(tempDir, "solution.js");
      fs.writeFileSync(filePath, runCode);
      const res = await runProcess(process.execPath || "node", ["solution.js"], tempDir, stdin, timeoutMs);
      return res;

    } else if (lang === "c++" || lang === "cpp") {
      const srcPath = path.join(tempDir, "main.cpp");
      const binName = process.platform === "win32" ? "solution.exe" : "solution";
      const binPath = path.join(tempDir, binName);
      fs.writeFileSync(srcPath, code);

      const compileRes = await runProcess("g++", ["-O2", "-std=c++17", "-o", binName, "main.cpp"], tempDir, "", 8000);
      if (compileRes.code !== 0) {
        return {
          stdout: "",
          stderr: compileRes.stderr || "Compilation failed",
          code: compileRes.code,
          time: compileRes.time,
          compileError: compileRes.stderr || "Compilation failed",
        };
      }

      const runRes = await runProcess(binPath, [], tempDir, stdin, timeoutMs);
      return runRes;

    } else if (lang === "java") {
      const srcPath = path.join(tempDir, "Solution.java");
      fs.writeFileSync(srcPath, code);

      const compileRes = await runProcess("javac", ["Solution.java"], tempDir, "", 8000);
      if (compileRes.code !== 0) {
        return {
          stdout: "",
          stderr: compileRes.stderr || "Java compilation failed",
          code: compileRes.code,
          time: compileRes.time,
          compileError: compileRes.stderr || "Java compilation failed",
        };
      }

      const runRes = await runProcess("java", ["-Xmx128m", "Solution"], tempDir, stdin, timeoutMs);
      return runRes;
    }

    return {
      stdout: "",
      stderr: `Unsupported language for local runner: ${language}`,
      code: 1,
      time: 0,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}
