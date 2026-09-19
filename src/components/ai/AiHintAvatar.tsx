"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  X,
  ChevronRight,
  Lightbulb,
  Send,
  Loader2,
  Code2,
  AlertTriangle,
  Check,
  Copy,
  RotateCcw,
  HelpCircle,
  Minimize2,
  Flame,
  Brain,
  MessageSquare,
} from "lucide-react";

export interface AiHintAvatarProps {
  problemTitle: string;
  problemDifficulty?: string;
  problemDescription?: string;
  userCode?: string;
  language?: string;
}

const HINT_STEPS = [
  { level: 1, label: "Intuition", desc: "Pattern & Analogy", icon: Lightbulb },
  { level: 2, label: "Algorithm", desc: "Step-by-step Logic", icon: Brain },
  { level: 3, label: "Edge Cases", desc: "Complexity & Pitfalls", icon: AlertTriangle },
  { level: 4, label: "Scaffold", desc: "Structural Blueprint", icon: Code2 },
];

export default function AiHintAvatar({
  problemTitle,
  problemDifficulty = "Medium",
  problemDescription = "",
  userCode = "",
  language = "python",
}: AiHintAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswers, setCustomAnswers] = useState<
    Array<{ q: string; a: string; time: string }>
  >([]);
  const [includeCode, setIncludeCode] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch hint for a specific level
  const fetchHint = async (level: number) => {
    if (hints[level]) {
      setActiveTab(level);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setIsConfigError(false);

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle,
          problemDifficulty,
          problemDescription,
          userCode: includeCode ? userCode : "",
          language,
          hintLevel: level,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isConfigError) {
          setIsConfigError(true);
        }
        setErrorMsg(data.error || "Failed to fetch hint from AI.");
        return;
      }

      setHints((prev) => ({ ...prev, [level]: data.hint }));
      setMaxUnlockedLevel((prev) => Math.max(prev, level));
      setActiveTab(level);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error fetching AI hint.");
    } finally {
      setLoading(false);
    }
  };

  // Ask custom question or quick chip
  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || customQuestion).trim();
    if (!q || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setCustomQuestion("");

    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle,
          problemDifficulty,
          problemDescription,
          userCode: includeCode ? userCode : "",
          language,
          customPrompt: q,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isConfigError) {
          setIsConfigError(true);
        }
        setErrorMsg(data.error || "Failed to get AI answer.");
        return;
      }

      setCustomAnswers((prev) => [
        ...prev,
        {
          q,
          a: data.hint,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setHints({});
    setMaxUnlockedLevel(0);
    setActiveTab(1);
    setCustomAnswers([]);
    setErrorMsg(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hints, customAnswers, loading]);

  const renderFormattedText = (text: string) => {
    // Basic clean formatting for markdown: headers, code blocks, bold, lists
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-xs leading-relaxed text-zinc-300">
        {lines.map((line, idx) => {
          if (line.startsWith("```")) {
            return (
              <div key={idx} className="my-1.5 px-2 py-0.5 font-mono text-[10px] text-zinc-500 bg-zinc-900/80 rounded border border-zinc-800/80">
                {line.replace("```", "") || "code"}
              </div>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>{renderInlineStyles(line.slice(2))}</span>
              </div>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="font-semibold text-zinc-100 text-xs mt-3 mb-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} className="font-bold text-zinc-100 text-sm mt-3 mb-1">
                {line.replace("## ", "")}
              </h3>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (str: string) => {
    // Format `code` and **bold**
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-800/80 font-mono text-[11px] text-emerald-300 border border-zinc-700/50"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating AI Avatar Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-5 z-40 flex items-center gap-2 animate-fade-in">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              if (maxUnlockedLevel === 0) {
                fetchHint(1);
              }
            }}
            className="group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-emerald-500/40 bg-zinc-950/95 hover:bg-zinc-900 text-zinc-100 shadow-xl shadow-emerald-950/30 hover:border-emerald-400 hover:scale-[1.03] transition-all duration-200"
            title="Ask AI Coach for progressive hints"
          >
            {/* Glowing Orb Animation */}
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-sm">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
                <Bot className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-200" />
              </span>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </span>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1">
                AI Hints
                <Sparkles className="h-3 w-3 text-emerald-400" />
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {maxUnlockedLevel > 0 ? `Hint ${maxUnlockedLevel}/4 Ready` : "Stuck? Get a nudge"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded AI Hint Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed right-5 bottom-4 z-50 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl shadow-black/80 transition-all duration-200 ${
            isMinimized
              ? "w-80 h-14 overflow-hidden"
              : "w-[94vw] sm:w-[440px] md:w-[470px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
                  <Bot className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-100 truncate">
                    PrepForge AI Coach
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
                    Gemini
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-[220px]">
                  {problemTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                title="Reset Hints"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Progressive Hint Stepper Bar */}
              <div className="px-3 pt-2.5 pb-2 border-b border-zinc-800/60 bg-zinc-900/20">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                  <span>Step-by-Step Guidance</span>
                  <span className="text-emerald-400 font-medium">
                    {maxUnlockedLevel}/4 Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {HINT_STEPS.map((step) => {
                    const isUnlocked = !!hints[step.level];
                    const isActive = activeTab === step.level;
                    const StepIcon = step.icon;

                    return (
                      <button
                        key={step.level}
                        onClick={() => {
                          if (isUnlocked) {
                            setActiveTab(step.level);
                          } else if (step.level <= maxUnlockedLevel + 1) {
                            fetchHint(step.level);
                          }
                        }}
                        disabled={loading && !isUnlocked}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-md border text-center transition-all ${
                          isActive
                            ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 shadow-sm"
                            : isUnlocked
                            ? "border-zinc-700/60 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/60"
                            : step.level === maxUnlockedLevel + 1
                            ? "border-dashed border-emerald-500/40 bg-zinc-950 text-emerald-400/80 hover:border-emerald-400 hover:bg-emerald-950/20"
                            : "border-zinc-800/40 bg-zinc-950/50 text-zinc-600 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-medium">
                          <StepIcon className="h-3 w-3" />
                          <span>{step.label}</span>
                        </div>
                        <span className="text-[8px] opacity-70 font-mono">
                          {isUnlocked ? "Ready" : step.level === maxUnlockedLevel + 1 ? "Unlock" : "Locked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 font-sans"
              >
                {/* Configuration Error Alert */}
                {isConfigError && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <span>Gemini API Key Required</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      To enable AI hints, add your Google Gemini API key to your environment:
                    </p>
                    <div className="p-1.5 rounded bg-zinc-950/80 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                      GEMINI_API_KEY=&quot;your_key_here&quot;
                    </div>
                  </div>
                )}

                {/* General Error Alert */}
                {errorMsg && !isConfigError && (
                  <div className="p-2.5 rounded-md border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Active Hint View */}
                {hints[activeTab] ? (
                  <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 relative group">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Sparkles className="h-3 w-3" />
                        {HINT_STEPS[activeTab - 1]?.label} Hint ({activeTab}/4)
                      </span>
                      <button
                        onClick={() => handleCopyHint(hints[activeTab])}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {renderFormattedText(hints[activeTab])}

                    {/* Next Hint Action Button */}
                    {activeTab < 4 && !hints[activeTab + 1] && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/60 flex justify-end">
                        <button
                          onClick={() => fetchHint(activeTab + 1)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Generating next hint...</span>
                            </>
                          ) : (
                            <>
                              <span>Unlock Hint {activeTab + 1}: {HINT_STEPS[activeTab]?.label}</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  !loading &&
                  maxUnlockedLevel === 0 &&
                  !errorMsg && (
                    <div className="text-center py-8 px-4">
                      <div className="h-10 w-10 mx-auto mb-2 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center text-emerald-400">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 mb-1">
                        Ready to Tackle this Problem?
                      </h4>
                      <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mb-4">
                        I can give you progressive, Socratic hints without spoiling the final answer.
                      </p>
                      <button
                        onClick={() => fetchHint(1)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Get First Hint (Intuition)</span>
                      </button>
                    </div>
                  )
                )}

                {/* Custom Q&A History */}
                {customAnswers.map((item, index) => (
                  <div key={index} className="space-y-2">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg px-2.5 py-1.5 bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs">
                        <p className="font-medium">{item.q}</p>
                        <span className="text-[9px] text-emerald-400/60 font-mono block text-right mt-0.5">
                          {item.time}
                        </span>
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex justify-start">
                      <div className="max-w-[95%] rounded-lg p-2.5 bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs">
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mb-1">
                          <Bot className="h-3 w-3" />
                          <span>AI Coach</span>
                        </div>
                        {renderFormattedText(item.a)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 text-zinc-400 text-xs animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Gemini is thinking about {problemTitle}...</span>
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-1.5 border-t border-zinc-800/60 bg-zinc-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleAskQuestion("Can you review my current code and spot any potential bugs without giving away the answer?")}
                  disabled={loading || !userCode.trim()}
                  className="shrink-0 px-2 py-1 rounded text-[10px] border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                  title="Analyze code in editor"
                >
                  🔍 Spot bugs in code
                </button>
                <button
                  onClick={() => handleAskQuestion("What are the most critical edge cases to consider for this problem?")}
                  disabled={loading}
                  className="shrink-0 px-2 py-1 rounded text-[10px] border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  ⚠️ Check edge cases
                </button>
                <button
                  onClick={() => handleAskQuestion("What is the optimal Time and Space complexity for this problem?")}
                  disabled={loading}
                  className="shrink-0 px-2 py-1 rounded text-[10px] border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                >
                  ⏱️ Target complexity
                </button>
              </div>

              {/* Input Footer */}
              <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Ask AI Coach a question..."
                    disabled={loading}
                    className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                  <button
                    type="submit"
                    disabled={!customQuestion.trim() || loading}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
                    title="Send Question"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                <div className="flex items-center justify-between pt-1.5 px-0.5 text-[10px] text-zinc-500 font-mono">
                  <label className="flex items-center gap-1 cursor-pointer hover:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={includeCode}
                      onChange={(e) => setIncludeCode(e.target.checked)}
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                    />
                    <span>Include my code from editor</span>
                  </label>
                  <span>Socratic Tutor</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
