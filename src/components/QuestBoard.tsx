"use client";

import { useState } from "react";
import Link from "next/link";
import QuestCard, { type Quest } from "@/components/QuestCard";
import { ArrowRight, CheckCircle2, Circle, ExternalLink, Filter } from "lucide-react";

export default function QuestBoard({
  muted = true,
  questions = [],
  completedQuestTitles = [],
}: {
  muted?: boolean;
  questions?: any[];
  completedQuestTitles?: string[];
}) {
  const [filter, setFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");

  const filteredQuestions = questions.filter((q) => {
    if (filter === "ALL") return true;
    return q.difficulty?.toUpperCase() === filter;
  });

  const displayedQuestions = filteredQuestions.slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setFilter(diff)}
              className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
                filter === diff
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <Link
          href="/dsa"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <span>Full Problem Set ({questions.length})</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of clean problem cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedQuestions.map((q, i) => {
          const isCompleted = completedQuestTitles.includes(q.title);
          const questProp: Quest = {
            id: q.id,
            title: q.title,
            difficulty: q.difficulty as "Easy" | "Medium" | "Hard",
            xp: q.difficulty === "Easy" ? 100 : q.difficulty === "Medium" ? 300 : 700,
            active: i === 0,
            url: q.url,
            solution_link: q.solution_link,
            platform: q.platform,
            description: q.description,
            topics: q.topics,
            completed: isCompleted,
          };

          return (
            <QuestCard
              key={q.id || i}
              quest={questProp}
              index={i}
              hideDetails={false}
            />
          );
        })}

        {displayedQuestions.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-lg border border-dashed border-zinc-800 text-zinc-500 text-xs font-mono">
            No problems match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}