"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Search,
  ExternalLink,
  FileCode2,
  Lightbulb,
  LayoutGrid,
  List,
} from "lucide-react";
import QuestCard, { type Quest } from "@/components/QuestCard";

export default function ClientQuestsView({
  questions = [],
  completedTitles = [],
}: {
  questions?: any[];
  completedTitles?: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SOLVED" | "TODO">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Group questions by topic
  const { topics, questionsByTopic } = useMemo(() => {
    const topicMap: Record<string, any[]> = { All: questions };

    questions.forEach((q) => {
      if (q.topics && q.topics.length > 0) {
        q.topics.forEach((topic: string) => {
          if (!topicMap[topic]) topicMap[topic] = [];
          topicMap[topic].push(q);
        });
      } else {
        if (!topicMap["Uncategorized"]) topicMap["Uncategorized"] = [];
        topicMap["Uncategorized"].push(q);
      }
    });

    const sortedTopics = Object.keys(topicMap).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      return a.localeCompare(b);
    });

    return { topics: sortedTopics, questionsByTopic: topicMap };
  }, [questions]);

  // Filtered list based on selected topic, difficulty, status, and search query
  const displayedQuestions = useMemo(() => {
    const topicList = questionsByTopic[selectedTopic] || [];
    const completedSet = new Set(completedTitles);

    return topicList.filter((q) => {
      const isCompleted = completedSet.has(q.title);

      if (difficultyFilter !== "ALL" && q.difficulty?.toUpperCase() !== difficultyFilter) {
        return false;
      }

      if (statusFilter === "SOLVED" && !isCompleted) return false;
      if (statusFilter === "TODO" && isCompleted) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = q.title?.toLowerCase().includes(query);
        const matchTopic = q.topics?.some((t: string) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchTopic) return false;
      }

      return true;
    });
  }, [questionsByTopic, selectedTopic, completedTitles, difficultyFilter, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Topics Sidebar - Expanded and larger text */}
      <aside className="w-full lg:w-72 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pb-3 mb-3 border-b border-zinc-800 text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
          <span>Categories</span>
          <span>{questions.length} problems</span>
        </div>

        <div className="flex flex-row lg:flex-col gap-1.5 max-h-[70vh] overflow-y-auto overflow-x-auto pr-1">
          {topics.map((topic) => {
            const count = questionsByTopic[topic]?.length || 0;
            const isSelected = selectedTopic === topic;

            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors shrink-0 lg:shrink ${
                  isSelected
                    ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                <span className="truncate pr-2">{topic}</span>
                <span className="font-mono text-xs text-zinc-500 font-normal">{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 w-full min-w-0">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or tag..."
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs font-mono">
              {(["ALL", "TODO", "SOLVED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-xs font-mono">
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                    difficultyFilter === diff
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 text-zinc-400">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded ${viewMode === "table" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "hover:text-zinc-200"}`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "hover:text-zinc-200"}`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Table (Default LeetCode Style) */}
        {viewMode === "table" ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-5 w-16 text-center">Status</th>
                    <th className="py-3 px-5">Title &amp; Topics</th>
                    <th className="py-3 px-5 w-32">Difficulty</th>
                    <th className="py-3 px-5 w-32">Platform</th>
                    <th className="py-3 px-5 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {displayedQuestions.map((q, idx) => {
                    const isCompleted = completedTitles.includes(q.title);
                    const diff = q.difficulty?.toLowerCase() || "easy";
                    const diffClass =
                      diff === "easy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : diff === "medium"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20";

                    return (
                      <tr
                        key={q.id || idx}
                        className="hover:bg-zinc-900/80 transition-colors group"
                      >
                        <td className="py-3.5 px-5 text-center">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 inline-block" />
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-600 inline-block group-hover:text-zinc-500" />
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1.5">
                            <Link
                              href={q.id ? `/quests/${q.id}` : q.url || "#"}
                              className="font-semibold text-sm sm:text-base text-zinc-200 group-hover:text-white hover:underline inline-flex items-center gap-1.5"
                            >
                              <span>{q.title}</span>
                            </Link>
                            {q.topics && q.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {q.topics.slice(0, 4).map((t: string, i: number) => (
                                  <span
                                    key={i}
                                    className="rounded bg-zinc-950 px-2 py-0.5 text-xs font-mono text-zinc-400 border border-zinc-800/80"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${diffClass}`}
                          >
                            {q.difficulty}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 font-mono text-zinc-400 text-xs sm:text-sm">
                          {q.platform || "LeetCode"}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {q.id && (
                              <Link
                                href={`/quests/${q.id}`}
                                className="rounded-md border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                                title="View Specs"
                              >
                                <FileCode2 className="h-4 w-4" />
                              </Link>
                            )}

                            {q.solution_link && (
                              <a
                                href={q.solution_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
                                title="Solution"
                              >
                                <Lightbulb className="h-4 w-4" />
                              </a>
                            )}

                            {q.url && (
                              <a
                                href={q.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <span>Solve</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {displayedQuestions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-zinc-500 font-mono text-sm">
                        No problems match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400">
              Showing {displayedQuestions.length} of {questions.length} problems
            </div>
          </div>
        ) : (
          /* View Mode: Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedQuestions.map((q, i) => {
              const isCompleted = completedTitles.includes(q.title);
              const questProp: Quest = {
                id: q.id,
                title: q.title,
                difficulty: q.difficulty as "Easy" | "Medium" | "Hard",
                xp: q.difficulty === "Easy" ? 100 : q.difficulty === "Medium" ? 300 : 700,
                url: q.url,
                solution_link: q.solution_link,
                platform: q.platform,
                description: q.description,
                topics: q.topics,
                completed: isCompleted,
              };

              return <QuestCard key={q.id || i} quest={questProp} index={i} />;
            })}

            {displayedQuestions.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-sm">
                No problems match the current filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
