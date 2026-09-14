const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const RUNTIMES = [
  { language: "python", version: "3.10.x", aliases: ["py", "python3"] },
  { language: "javascript", version: "20.x", aliases: ["js", "node"] },
  { language: "typescript", version: "5.x", aliases: ["ts"] },
  { language: "c++", version: "g++ 11.4", aliases: ["cpp"] },
  { language: "java", version: "openjdk 17", aliases: ["java"] },
];

app.get("/api/v2/runtimes", (req, res) => {
  res.json(RUNTIMES);
});

function runCommand(command, args, options, stdinInput, timeoutMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isTimedOut = false;

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { PATH: process.env.PATH, LANG: "C.UTF-8" },
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    if (stdinInput && child.stdin) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.stdout.on("data", (data) => {
      stdout += data.toString();
      if (stdout.length > 100000) {
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
      if (stderr.length > 50000) {
        child.kill("SIGKILL");
      }
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      if (isTimedOut) {
        resolve({
          stdout,
          stderr: "Time Limit Exceeded (Execution timed out)",
          code: 124,
          signal: "SIGKILL",
          time: executionTime,
        });
      } else {
        resolve({
          stdout,
          stderr,
          code: code ?? 0,
          signal: signal ?? null,
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
        signal: null,
        time: Date.now() - startTime,
      });
    });
  });
}

app.post("/api/v2/execute", async (req, res) => {
  const { language, files, stdin = "", run_timeout = 4000, compile_timeout = 8000 } = req.body;

  if (!language || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Missing language or files array" });
  }

  const lang = language.toLowerCase();
  const code = files[0].content || "";

  // Create isolated temp directory
  let tempDir;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "interviewos-box-"));
  } catch (err) {
    return res.status(500).json({ error: "Failed to create sandbox directory" });
  }

  try {
    let compileResult = null;
    let runResult = null;

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
      runResult = await runCommand("python3", ["solution.py"], { cwd: tempDir }, stdin, run_timeout);
    } else if (lang === "javascript" || lang === "js" || lang === "node") {
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
      runResult = await runCommand("node", ["solution.js"], { cwd: tempDir }, stdin, run_timeout);
    } else if (lang === "c++" || lang === "cpp") {
      if (!code.includes("main(") && !code.includes("main (")) {
        return res.json({
          compile: {
            stderr: "C++ requires an int main() function. Switch to Python/JavaScript to use Function-Only mode, or add an int main() to call your Solution class."
          },
          run: { stdout: "", stderr: "C++ requires main()", code: 1, time: 0 }
        });
      }

      const srcPath = path.join(tempDir, "main.cpp");
      const binPath = path.join(tempDir, "solution");
      fs.writeFileSync(srcPath, code);

      compileResult = await runCommand(
        "g++",
        ["-O2", "-std=c++17", "-o", "solution", "main.cpp"],
        { cwd: tempDir },
        "",
        compile_timeout
      );

      if (compileResult.code !== 0) {
        return res.json({
          compile: { stderr: compileResult.stderr || "Compilation failed" },
          run: { stdout: "", stderr: compileResult.stderr, code: compileResult.code, time: compileResult.time },
        });
      }

      runResult = await runCommand("./solution", [], { cwd: tempDir }, stdin, run_timeout);
    } else if (lang === "java") {
      const srcPath = path.join(tempDir, "Solution.java");
      fs.writeFileSync(srcPath, code);

      compileResult = await runCommand(
        "javac",
        ["Solution.java"],
        { cwd: tempDir },
        "",
        compile_timeout
      );

      if (compileResult.code !== 0) {
        return res.json({
          compile: { stderr: compileResult.stderr || "Java compilation failed" },
          run: { stdout: "", stderr: compileResult.stderr, code: compileResult.code, time: compileResult.time },
        });
      }

      runResult = await runCommand(
        "java",
        ["-Xmx128m", "Solution"],
        { cwd: tempDir },
        stdin,
        run_timeout
      );
    } else {
      return res.status(400).json({ error: `Language '${language}' is not supported.` });
    }

    res.json({
      compile: compileResult ? { stderr: compileResult.stderr } : undefined,
      run: runResult,
    });
  } catch (err) {
    console.error("Execution error:", err);
    res.status(500).json({ error: err.message || "Internal runner error" });
  } finally {
    // Clean up temporary workspace
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`InterviewOS Sandbox Runner listening on port ${PORT}`);
});
