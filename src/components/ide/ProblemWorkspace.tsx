"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  ArrowLeft,
  FileCode2,
  Sparkles,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Globe,
  Key,
  Zap,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { completeQuestAction } from "@/app/quest-actions";

export interface QuestionData {
  id: string;
  title: string;
  difficulty: string;
  platform?: string;
  description: string;
  topics?: string[];
  url?: string;
  solution_link?: string;
  xp?: number;
}

interface ProblemWorkspaceProps {
  question: QuestionData;
  isInitiallyCompleted: boolean;
  userEmail: string | null;
  initialSnippets?: Record<string, string>;
}

const STARTER_TEMPLATES: Record<string, string> = {
  python: `# Solution for: {TITLE}
import sys

def solve():
    # Read all input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Process and print output
    # Example: print first token
    print(input_data[0])

if __name__ == "__main__":
    solve()
`,
  javascript: `// Solution for: {TITLE}
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;

    // Process and print output
    console.log(input);
}

solve();
`,
  cpp: `// Solution for: {TITLE}
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string token;
    if (cin >> token) {
        cout << token << "\\n";
    }

    return 0;
}
`,
  java: `// Solution for: {TITLE}
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNext()) {
            System.out.println(scanner.next());
        }
        scanner.close();
    }
}
`,
};

interface TestCaseItem {
  id: number;
  input: string;
  expectedOutput: string;
}

interface TestRunResult {
  input: string;
  expected?: string;
  actual: string;
  passed: boolean | null;
  stderr?: string;
  executionTime?: number;
}

export function extractTestCases(description?: string, rawTestCases?: string): TestCaseItem[] {
  const extracted: TestCaseItem[] = [];

  if (description) {
    // 1. Codeforces Format: <div class="sample-test"><div class="input"><pre>...</pre></div><div class="output"><pre>...</pre></div></div>
    if (description.includes('class="sample-test"') || description.includes('class="input"')) {
      const inputMatches = [
        ...description.matchAll(/<div class="input">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi),
      ];
      const outputMatches = [
        ...description.matchAll(/<div class="output">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi),
      ];

      for (let i = 0; i < inputMatches.length; i++) {
        const rawInput = inputMatches[i][1];
        const rawOutput = outputMatches[i] ? outputMatches[i][1] : "";

        const cleanInput = rawInput
          .replace(/<div[^>]*>/gi, "")
          .replace(/<\/div>/gi, "\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .trim();

        const cleanOutput = rawOutput
          .replace(/<div[^>]*>/gi, "")
          .replace(/<\/div>/gi, "\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .trim();

        if (cleanInput || cleanOutput) {
          extracted.push({
            id: i + 1,
            input: cleanInput,
            expectedOutput: cleanOutput,
          });
        }
      }
    }

    // 2. LeetCode Format: <pre><strong>Input:</strong> ... <strong>Output:</strong> ...</pre>
    if (extracted.length === 0) {
      const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
      let match: RegExpExecArray | null;
      let caseId = 1;

      while ((match = preRegex.exec(description)) !== null) {
        const text = match[1]
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"');

        const inputMatch = text.match(
          /Input:\s*([^\n\r]+(?:\n(?!\s*(?:Output|Explanation):)[^\n\r]+)*)/i
        );
        const outputMatch = text.match(
          /Output:\s*([^\n\r]+(?:\n(?!\s*(?:Explanation|Example):)[^\n\r]+)*)/i
        );

        if (inputMatch) {
          // Clean variable names like "n = 2, trust = [[1,2]]" -> "2, [[1,2]]"
          let cleanInput = inputMatch[1]
            .replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*/g, "")
            .trim();

          extracted.push({
            id: caseId++,
            input: cleanInput,
            expectedOutput: outputMatch ? outputMatch[1].trim() : "",
          });
        }
      }
    }
  }

  // 3. Fallback to raw test_cases column if description parsing found none
  if (extracted.length === 0 && rawTestCases && !rawTestCases.includes("See description")) {
    const lines = rawTestCases.split("\n").filter((l) => l.trim().length > 0);
    lines.forEach((line, idx) => {
      extracted.push({
        id: idx + 1,
        input: line.trim(),
        expectedOutput: "",
      });
    });
  }

  if (extracted.length === 0) {
    extracted.push({ id: 1, input: "", expectedOutput: "" });
  }

  return extracted;
}

export default function ProblemWorkspace({
  question,
  isInitiallyCompleted,
  userEmail,
  initialSnippets,
}: ProblemWorkspaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [isCompleted, setIsCompleted] = useState<boolean>(isInitiallyCompleted);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"testcase" | "result">("testcase");
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [awardMessage, setAwardMessage] = useState<string | null>(null);

  const [isSubmittingLeetCode, setIsSubmittingLeetCode] = useState<boolean>(false);
  const [leetCodeResult, setLeetCodeResult] = useState<any | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [sessionInput, setSessionInput] = useState<string>("");
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);
  const [showSessionSecret, setShowSessionSecret] = useState<boolean>(false);
  const [sessionFeedbackMsg, setSessionFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isBrowserLoggingIn, setIsBrowserLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("leetcode_session");
      setHasSavedSession(!!saved && saved.trim().length > 0);
    }
  }, []);

  const isLeetCode = question.platform?.toLowerCase() === "leetcode";

  // Initialize testcases dynamically from question content
  const [testCases, setTestCases] = useState<TestCaseItem[]>(() =>
    extractTestCases(question.description, (question as any).test_cases)
  );

  // Code state per language (uses official LeetCode boilerplate when available)
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [lang, tmpl] of Object.entries(STARTER_TEMPLATES)) {
      initial[lang] = tmpl.replace("{TITLE}", question.title);
    }
    if (initialSnippets) {
      for (const [lang, snippet] of Object.entries(initialSnippets)) {
        if (snippet && snippet.trim()) {
          initial[lang] = snippet;
        }
      }
    }
    return initial;
  });

  // Results state
  const [runResults, setRunResults] = useState<TestRunResult[] | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  const currentCode = codeMap[selectedLanguage] || "";

  const handleCodeChange = (newCode: string) => {
    setCodeMap((prev) => ({ ...prev, [selectedLanguage]: newCode }));
  };

  const handleResetCode = () => {
    if (confirm("Reset editor to original template?")) {
      const template =
        initialSnippets?.[selectedLanguage] ||
        (STARTER_TEMPLATES[selectedLanguage] || "").replace("{TITLE}", question.title);
      setCodeMap((prev) => ({
        ...prev,
        [selectedLanguage]: template,
      }));
    }
  };

  const handleAddTestCase = () => {
    const nextId = testCases.length + 1;
    const newCase: TestCaseItem = { id: nextId, input: "", expectedOutput: "" };
    setTestCases((prev) => [...prev, newCase]);
    setActiveCaseIndex(testCases.length);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
    setActiveCaseIndex(Math.max(0, index - 1));
  };

  // Run Code against testcases
  const executeCode = async (isSubmission: boolean = false) => {
    if (isSubmission) {
      setIsSubmitting(true);
    } else {
      setIsRunning(true);
    }

    setActiveConsoleTab("result");
    setCompileError(null);

    try {
      const payload = {
        language: selectedLanguage,
        code: currentCode,
        testCases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      };

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setCompileError(data.error || "Execution failed");
        setRunResults(null);
        setAllPassed(false);
        return;
      }

      setRunResults(data.results || []);
      setAllPassed(data.allPassed);
      setCompileError(data.compileError || null);

      // If submission succeeded and passed all test cases, award XP
      if (isSubmission && data.allPassed) {
        startTransition(async () => {
          const questXp = question.xp || 50;
          const result = await completeQuestAction(question.title, questXp);
          if (result.ok) {
            setIsCompleted(true);
            setAwardMessage(
              result.awarded
                ? `Accepted! +${questXp} XP Awarded (Level ${result.level})`
                : "Accepted! Quest already completed."
            );
          }
        });
      }
    } catch (err: any) {
      setCompileError(err.message || "Failed to communicate with sandbox");
    } finally {
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  const openSessionModal = () => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("leetcode_session") || ""
        : "";
    setSessionInput(saved);
    setHasSavedSession(!!saved.trim());
    setSessionFeedbackMsg(null);
    setShowSessionSecret(false);
    setIsSessionModalOpen(true);
  };

  const handleSaveCookieOnly = () => {
    const trimmed = sessionInput.trim();
    if (!trimmed) {
      setSessionFeedbackMsg({
        type: "error",
        text: "Cookie value cannot be empty.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("leetcode_session", trimmed);
    }
    setHasSavedSession(true);
    setSessionFeedbackMsg({
      type: "success",
      text: "LEETCODE_SESSION cookie saved successfully!",
    });
    setTimeout(() => {
      setIsSessionModalOpen(false);
      setSessionFeedbackMsg(null);
    }, 1200);
  };

  const handleSaveAndSubmit = () => {
    const trimmed = sessionInput.trim();
    if (!trimmed) {
      setSessionFeedbackMsg({
        type: "error",
        text: "Cookie value cannot be empty.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("leetcode_session", trimmed);
    }
    setHasSavedSession(true);
    setIsSessionModalOpen(false);
    setSessionFeedbackMsg(null);
    submitToLeetCodeHandler();
  };

  const handleClearCookie = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("leetcode_session");
    }
    setSessionInput("");
    setHasSavedSession(false);
    setSessionFeedbackMsg({
      type: "success",
      text: "LeetCode session cleared. Cookie removed from browser.",
    });
  };

  const handleBrowserLogin = async () => {
    setIsBrowserLoggingIn(true);
    setSessionFeedbackMsg({
      type: "success",
      text: "Detecting active LeetCode session...",
    });

    try {
      const res = await fetch("/api/leetcode/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success && data.sessionCookie) {
        if (typeof window !== "undefined") {
          localStorage.setItem("leetcode_session", data.sessionCookie);
        }
        setSessionInput(data.sessionCookie);
        setHasSavedSession(true);

        const sourceLabel =
          data.source === "firefox"
            ? "Firefox browser profile"
            : "LeetCode login window";

        setSessionFeedbackMsg({
          type: "success",
          text: `🎉 Connected successfully from your ${sourceLabel}!`,
        });
        setTimeout(() => {
          setIsSessionModalOpen(false);
          setSessionFeedbackMsg(null);
        }, 1600);
      } else {
        setSessionFeedbackMsg({
          type: "error",
          text: data.error || "Login window closed or canceled.",
        });
      }
    } catch (err: any) {
      setSessionFeedbackMsg({
        type: "error",
        text: err.message || "Failed to detect session.",
      });
    } finally {
      setIsBrowserLoggingIn(false);
    }
  };

  // Submit code directly to LeetCode official judge
  const submitToLeetCodeHandler = async () => {
    const session =
      typeof window !== "undefined"
        ? localStorage.getItem("leetcode_session") || ""
        : "";
    if (!session) {
      setSessionFeedbackMsg({
        type: "error",
        text: "Please connect your LEETCODE_SESSION cookie to submit.",
      });
      setIsSessionModalOpen(true);
      return;
    }

    setIsSubmittingLeetCode(true);
    setActiveConsoleTab("result");
    setCompileError(null);
    setRunResults(null);
    setLeetCodeResult(null);

    let slug = "";
    if (question.url && question.url.includes("/problems/")) {
      const match = question.url.match(/problems\/([^\/]+)/);
      slug = match ? match[1] : "";
    } else {
      slug = (question as any).platform_id || "";
    }

    try {
      const res = await fetch("/api/leetcode/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          language: selectedLanguage,
          code: currentCode,
          sessionCookie: session,
        }),
      });

      const data = await res.json();
      if (data.needsAuth) {
        setHasSavedSession(false);
        setSessionFeedbackMsg({
          type: "error",
          text: data.error || "LeetCode session expired or invalid. Please re-add your cookie.",
        });
        setIsSessionModalOpen(true);
        setCompileError(data.error || "LeetCode authentication required.");
        return;
      }

      if (!res.ok || !data.success) {
        setCompileError(data.error || "Submission to LeetCode failed.");
        return;
      }

      setLeetCodeResult(data);
      setAllPassed(data.isAccepted);

      if (data.isAccepted) {
        startTransition(async () => {
          const questXp = question.xp || 50;
          const result = await completeQuestAction(question.title, questXp);
          if (result.ok) {
            setIsCompleted(true);
            setAwardMessage(
              result.awarded
                ? `Accepted on LeetCode! +${questXp} XP Awarded (Level ${result.level})`
                : "Accepted on LeetCode! Quest already completed."
            );
          }
        });
      }
    } catch (err: any) {
      setCompileError(err.message || "Failed to communicate with LeetCode.");
    } finally {
      setIsSubmittingLeetCode(false);
    }
  };

  const diff = question.difficulty?.toLowerCase() || "easy";
  const diffClass =
    diff === "easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : diff === "medium"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] w-full overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/50 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Link
            href="/dsa"
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Problem Set</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 font-semibold truncate max-w-[200px] sm:max-w-md">
            {question.title}
          </span>
          <span className={`px-2 py-0.5 rounded border text-[11px] font-mono ${diffClass}`}>
            {question.difficulty}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium ml-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Solved</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {awardMessage && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              {awardMessage}
            </span>
          )}

          {isLeetCode && (
            <button
              onClick={openSessionModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors text-xs ${
                hasSavedSession
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/60"
                  : "border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30 hover:border-amber-500/60"
              }`}
              title={
                hasSavedSession
                  ? "LeetCode Connected — Click to re-add, update, or disconnect"
                  : "Connect your LeetCode session cookie for direct submissions"
              }
            >
              <Key className={`h-3 w-3 ${hasSavedSession ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="hidden sm:inline">
                {hasSavedSession ? "LeetCode Connected" : "Connect LeetCode"}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  hasSavedSession ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
            </button>
          )}

          {question.solution_link && (
            <a
              href={question.solution_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-300 transition-colors"
              title="View Editorial"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Editorial</span>
            </a>
          )}
          {question.url && (
            <a
              href={question.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Open External Source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Source</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Resizable Workspace */}
      <div className="flex-1 w-full overflow-hidden">
        <Group orientation="horizontal" id="interviewos-ide-layout">
          {/* Left Panel: Problem Specification */}
          <Panel defaultSize="44%" minSize="25%" className="flex flex-col border-r border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/40 text-xs font-mono text-zinc-400">
              <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                <FileCode2 className="h-3.5 w-3.5 text-zinc-400" />
                Description
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
                  {question.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${diffClass}`}>
                    {question.difficulty}
                  </span>
                  <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                    {question.platform || "LeetCode"}
                  </span>
                </div>
              </div>

              {/* Problem Body */}
              <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                    .spec-content { color: #d4d4d8; font-size: 14px; line-height: 1.7; }
                    .spec-content p { margin-bottom: 1rem; }
                    .spec-content pre {
                      background: #121215;
                      border: 1px solid #27272a;
                      padding: 12px 16px;
                      border-radius: 6px;
                      font-family: var(--font-mono), monospace;
                      font-size: 12px;
                      overflow-x: auto;
                      color: #f4f4f5;
                      margin: 1rem 0;
                    }
                    .spec-content code {
                      background: #18181b;
                      border: 1px solid #27272a;
                      padding: 2px 5px;
                      border-radius: 4px;
                      font-family: var(--font-mono), monospace;
                      font-size: 12px;
                      color: #e4e4e7;
                    }
                    .spec-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
                    .spec-content li { margin-bottom: 0.35rem; }
                    .spec-content strong { color: #fafafa; }
                  `,
                  }}
                />
                <div
                  className="spec-content"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />
              </div>

              {/* Topics */}
              {question.topics && question.topics.length > 0 && (
                <div className="pt-4 border-t border-zinc-800/60">
                  <div className="text-xs font-mono text-zinc-400 mb-2">Related Topics:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {question.topics.map((t, i) => (
                      <span
                        key={i}
                        className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-1.5 bg-zinc-900 hover:bg-zinc-700 transition-colors cursor-col-resize flex items-center justify-center">
            <div className="w-0.5 h-6 bg-zinc-700 rounded-full" />
          </Separator>

          {/* Right Panel: Editor + Test Output Console */}
          <Panel defaultSize="56%" minSize="30%" className="flex flex-col bg-[#1e1e1e]">
            <Group orientation="vertical" id="interviewos-editor-console">
              {/* Top: Editor */}
              <Panel defaultSize="62%" minSize="30%" className="flex flex-col bg-[#1e1e1e]">
                {/* Editor Header Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/70 text-xs">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded px-2.5 py-1 font-mono focus:outline-none focus:border-zinc-500"
                    >
                      <option value="python">Python 3 (3.10)</option>
                      <option value="javascript">JavaScript (Node 18)</option>
                      <option value="cpp">C++ (GCC 10.2)</option>
                      <option value="java">Java (OpenJDK 15)</option>
                    </select>

                    <button
                      onClick={handleResetCode}
                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded transition-colors text-xs"
                      title="Reset to starter template"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Docker Sandbox Active</span>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 w-full overflow-hidden">
                  <CodeEditor
                    language={selectedLanguage}
                    code={currentCode}
                    onChange={handleCodeChange}
                  />
                </div>
              </Panel>

              {/* Horizontal Resize Handle */}
              <Separator className="h-1.5 bg-zinc-900 hover:bg-zinc-700 transition-colors cursor-row-resize flex items-center justify-center">
                <div className="h-0.5 w-8 bg-zinc-700 rounded-full" />
              </Separator>

              {/* Bottom: Testcase & Output Console */}
              <Panel defaultSize="38%" minSize="20%" className="flex flex-col bg-zinc-950 border-t border-zinc-800">
                {/* Console Navigation Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveConsoleTab("testcase")}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        activeConsoleTab === "testcase"
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Test Cases ({testCases.length})
                    </button>
                    <button
                      onClick={() => setActiveConsoleTab("result")}
                      className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                        activeConsoleTab === "result"
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span>Execution Result</span>
                      {allPassed !== null && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            allPassed ? "bg-emerald-400" : "bg-rose-500"
                          }`}
                        />
                      )}
                    </button>
                  </div>

                  {/* Run / Submit Action Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => executeCode(false)}
                      disabled={isRunning || isSubmitting || isSubmittingLeetCode}
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Play className="h-3 w-3 fill-current text-zinc-300" />
                      <span>{isRunning ? "Running..." : "Run"}</span>
                    </button>

                    <button
                      onClick={() => executeCode(true)}
                      disabled={isRunning || isSubmitting || isPending || isSubmittingLeetCode}
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      title="Run against sample test cases locally"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSubmitting ? "Submitting..." : "Run Tests"}</span>
                    </button>

                    {isLeetCode && (
                      <button
                        onClick={submitToLeetCodeHandler}
                        disabled={isRunning || isSubmitting || isPending || isSubmittingLeetCode}
                        className="inline-flex items-center gap-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                        title="Submit directly to LeetCode official judge"
                      >
                        <Globe className="h-3 w-3" />
                        <span>
                          {isSubmittingLeetCode ? "Judging on LeetCode..." : "Submit to LeetCode"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Console Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
                  {activeConsoleTab === "testcase" ? (
                    <div className="space-y-3">
                      {/* Case selector tabs */}
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                        {testCases.map((tc, idx) => (
                          <div
                            key={tc.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                              activeCaseIndex === idx
                                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                                : "bg-zinc-900 text-zinc-400 hover:text-zinc-300"
                            }`}
                            onClick={() => setActiveCaseIndex(idx)}
                          >
                            <span>Case {idx + 1}</span>
                            {testCases.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTestCase(idx);
                                }}
                                className="text-zinc-500 hover:text-rose-400 p-0.5"
                                title="Remove test case"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          onClick={handleAddTestCase}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-dashed border-zinc-700 text-[11px]"
                          title="Add new test case"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Case</span>
                        </button>
                      </div>

                      {/* Active Test Case Inputs */}
                      {testCases[activeCaseIndex] && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <div className="text-zinc-400 mb-1 text-[11px]">Standard Input (stdin):</div>
                            <textarea
                              value={testCases[activeCaseIndex].input}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestCases((prev) =>
                                  prev.map((c, i) =>
                                    i === activeCaseIndex ? { ...c, input: val } : c
                                  )
                                );
                              }}
                              placeholder="Enter stdin input..."
                              rows={2}
                              className="w-full rounded bg-zinc-900 border border-zinc-800 p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                            />
                          </div>

                          <div>
                            <div className="text-zinc-400 mb-1 text-[11px]">Expected Output:</div>
                            <textarea
                              value={testCases[activeCaseIndex].expectedOutput}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTestCases((prev) =>
                                  prev.map((c, i) =>
                                    i === activeCaseIndex ? { ...c, expectedOutput: val } : c
                                  )
                                );
                              }}
                              placeholder="Enter expected stdout to compare against..."
                              rows={2}
                              className="w-full rounded bg-zinc-900 border border-zinc-800 p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Execution Result Tab */
                    <div className="space-y-3">
                      {isRunning || isSubmitting ? (
                        <div className="flex items-center gap-2 text-zinc-400 py-6 justify-center">
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span>Running code inside isolated Docker sandbox...</span>
                        </div>
                      ) : isSubmittingLeetCode ? (
                        <div className="flex flex-col items-center gap-2 text-zinc-300 py-8 justify-center">
                          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <span className="font-semibold text-xs text-amber-300">
                            Submitting to LeetCode Official Judge...
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Evaluating code across LeetCode's complete hidden test suite
                          </span>
                        </div>
                      ) : compileError ? (
                        <div className="rounded border border-rose-900/50 bg-rose-950/20 p-3 text-rose-300">
                          <div className="flex items-center gap-2 font-bold mb-1.5 text-rose-400">
                            <XCircle className="h-4 w-4" />
                            <span>Compilation / Execution Error</span>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-mono text-rose-200/90 overflow-x-auto">
                            {compileError}
                          </pre>
                        </div>
                      ) : leetCodeResult ? (
                        <div className="space-y-4">
                          {/* LeetCode Official Verdict Card */}
                          <div
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border ${
                              leetCodeResult.isAccepted
                                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                                : "bg-rose-950/40 border-rose-800/60 text-rose-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {leetCodeResult.isAccepted ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                              )}
                              <div>
                                <div className="text-base font-bold">
                                  {leetCodeResult.statusMsg || "Evaluated"}
                                </div>
                                <div className="text-xs text-zinc-400">
                                  Passed {leetCodeResult.totalCorrect} / {leetCodeResult.totalTestcases} test cases on LeetCode
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              {leetCodeResult.runtime && (
                                <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800 text-center">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Runtime</span>
                                  <span className="font-bold text-zinc-100">{leetCodeResult.runtime}</span>
                                  {leetCodeResult.runtimePercentile && (
                                    <span className="text-[10px] text-emerald-400 block">Beats {leetCodeResult.runtimePercentile}</span>
                                  )}
                                </div>
                              )}
                              {leetCodeResult.memory && (
                                <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800 text-center">
                                  <span className="text-zinc-500 block text-[10px] uppercase font-mono">Memory</span>
                                  <span className="font-bold text-zinc-100">{leetCodeResult.memory}</span>
                                  {leetCodeResult.memoryPercentile && (
                                    <span className="text-[10px] text-emerald-400 block">Beats {leetCodeResult.memoryPercentile}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* If Wrong Answer: Show failing test case & outputs */}
                          {leetCodeResult.lastTestcase && (
                            <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-2.5 text-xs">
                              <div className="font-semibold text-zinc-300">Failing LeetCode Input:</div>
                              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono text-[11px] text-zinc-200 overflow-x-auto">
                                {leetCodeResult.lastTestcase}
                              </div>

                              {leetCodeResult.codeOutput && (
                                <div>
                                  <span className="text-zinc-400 block mb-1 text-[11px]">Your Code Output:</span>
                                  <div className="bg-rose-950/20 p-2.5 rounded border border-rose-900/30 font-mono text-rose-300 text-xs">
                                    {leetCodeResult.codeOutput}
                                  </div>
                                </div>
                              )}

                              {leetCodeResult.expectedOutput && (
                                <div>
                                  <span className="text-zinc-400 block mb-1 text-[11px]">Expected Output:</span>
                                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono text-emerald-400 text-xs">
                                    {leetCodeResult.expectedOutput}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {leetCodeResult.compileError && (
                            <div className="rounded border border-rose-900/50 bg-rose-950/20 p-3 text-rose-300">
                              <div className="font-bold mb-1 text-rose-400">LeetCode Compile Error:</div>
                              <pre className="text-xs whitespace-pre-wrap font-mono text-rose-200/90 overflow-x-auto">
                                {leetCodeResult.compileError}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : runResults ? (
                        <div className="space-y-4">
                          {/* Overall Verdict Banner */}
                          <div
                            className={`flex items-center justify-between p-3 rounded border ${
                              allPassed
                                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                                : "bg-rose-950/30 border-rose-800/50 text-rose-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-sm">
                              {allPassed ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  <span>Accepted — All Test Cases Passed!</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-rose-400" />
                                  <span>Wrong Answer / Failed Testcases</span>
                                </>
                              )}
                            </div>

                            {runResults[0]?.executionTime && (
                              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <Clock className="h-3 w-3" />
                                <span>{runResults[0].executionTime} ms</span>
                              </div>
                            )}
                          </div>

                          {/* Individual Test Results */}
                          <div className="space-y-2.5">
                            {runResults.map((r, i) => (
                              <div
                                key={i}
                                className="rounded border border-zinc-800 bg-zinc-900/40 p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-zinc-300">
                                    Test Case {i + 1}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      r.passed
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    }`}
                                  >
                                    {r.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-zinc-500 block mb-0.5">Input:</span>
                                    <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 text-zinc-300">
                                      {r.input || "<empty>"}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-zinc-500 block mb-0.5">Expected:</span>
                                    <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 text-zinc-300">
                                      {r.expected || "<empty>"}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-zinc-500 block mb-0.5">Output:</span>
                                  <div
                                    className={`p-1.5 rounded border font-mono text-xs ${
                                      r.passed
                                        ? "bg-zinc-950 border-zinc-800 text-emerald-300"
                                        : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                                    }`}
                                  >
                                    {r.actual || "<no output>"}
                                  </div>
                                </div>

                                {r.stderr && (
                                  <div>
                                    <span className="text-rose-400 block mb-0.5">Error Log:</span>
                                    <pre className="bg-rose-950/30 p-1.5 rounded text-rose-300 text-[11px] overflow-x-auto">
                                      {r.stderr}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-center py-8">
                          Click "Run" to test code against inputs, or "Submit" to evaluate solution.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      {/* Connect / Manage LeetCode Account Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Globe className="h-4 w-4 text-amber-400" />
                <span>LeetCode Account Connection</span>
                {hasSavedSession ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Not Connected
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification / Feedback Banner */}
            {sessionFeedbackMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                  sessionFeedbackMsg.type === "success"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/40 text-rose-300 border-rose-500/30"
                }`}
              >
                {sessionFeedbackMsg.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{sessionFeedbackMsg.text}</span>
              </div>
            )}

            <p className="text-xs text-zinc-400 leading-relaxed">
              To submit solutions directly to LeetCode, InterviewOS needs your{" "}
              <code className="text-amber-300 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800 font-mono">
                LEETCODE_SESSION
              </code>{" "}
              cookie. You can connect automatically below or paste it manually.
            </p>

            {/* 1-Click Automated Browser Login Card */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/25 to-zinc-950/60 p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>1-Click Auto-Detect &amp; Connect</span>
                    <span className="text-[10px] text-amber-400 font-mono font-normal border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 rounded">Instant</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Works automatically with Firefox or opens a quick sign-in window.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Click below to auto-import your active LeetCode session from Firefox or open a secure sign-in window. No DevTools or copying required!
              </p>

              <button
                type="button"
                onClick={handleBrowserLogin}
                disabled={isBrowserLoggingIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                {isBrowserLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    <span>Detecting LeetCode Session...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-zinc-950" />
                    <span>{hasSavedSession ? "Refresh / Re-detect LeetCode Session" : "1-Click Auto-Detect / Connect"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Separator */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <span className="relative bg-zinc-900 px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Or Paste Cookie Manually
              </span>
            </div>

            {/* Current Status / Disconnect Info */}
            {hasSavedSession && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>A LeetCode session cookie is currently configured.</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCookie}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-500/20 transition-colors"
                  title="Clear stored session cookie"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}

            {/* Step-by-step instructions */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3.5 text-[11px] text-zinc-400 space-y-2 font-mono">
              <div className="font-semibold text-zinc-300 font-sans text-xs mb-1 flex items-center justify-between">
                <span>Manual Cookie Guide (Any Browser):</span>
                <a
                  href="https://leetcode.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 font-normal inline-flex items-center gap-0.5 font-sans"
                >
                  leetcode.com <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="space-y-1">
                <div className="text-zinc-200 font-medium">🦊 Firefox:</div>
                <div className="pl-2.5 border-l border-zinc-800 space-y-0.5 text-zinc-400">
                  <div>1. Open <strong>leetcode.com</strong> in Firefox.</div>
                  <div>2. Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Shift + F9</kbd> (opens <strong>Storage</strong> inspector).</div>
                  <div>3. Expand <strong>Cookies</strong> &rarr; click <code className="text-zinc-300">https://leetcode.com</code>.</div>
                  <div>4. Right-click <code className="text-amber-300 font-bold">LEETCODE_SESSION</code> &rarr; <strong>Copy Value</strong>.</div>
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <div className="text-zinc-200 font-medium">🌐 Chrome / Edge / Brave / Opera:</div>
                <div className="pl-2.5 border-l border-zinc-800 space-y-0.5 text-zinc-400">
                  <div>1. Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">F12</kbd> &rarr; <strong>Application</strong> tab &rarr; <strong>Cookies</strong>.</div>
                  <div>2. Double-click the Value of <code className="text-amber-300 font-bold">LEETCODE_SESSION</code> and copy it.</div>
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  {hasSavedSession ? "Re-add / Update LEETCODE_SESSION Cookie:" : "Paste LEETCODE_SESSION Cookie:"}
                </label>
                {sessionInput && (
                  <button
                    type="button"
                    onClick={() => setShowSessionSecret((prev) => !prev)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                  >
                    {showSessionSecret ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Reveal
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showSessionSecret ? "text" : "password"}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJ..."
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 pr-8 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                />
                {sessionInput && (
                  <button
                    type="button"
                    onClick={() => setSessionInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs px-1"
                    title="Clear input"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                You can re-add or update this cookie anytime if your session expires or when logging into another account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              {hasSavedSession ? (
                <button
                  type="button"
                  onClick={handleClearCookie}
                  className="px-2.5 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove Cookie</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCookieOnly}
                  disabled={!sessionInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-medium text-xs transition-colors"
                >
                  <Check className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{hasSavedSession ? "Update Cookie" : "Save Cookie"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndSubmit}
                  disabled={!sessionInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  <Zap className="h-3 w-3" />
                  <span>Save &amp; Submit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
