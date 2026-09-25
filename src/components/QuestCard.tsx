"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink, FileCode2, Lightbulb, MessageSquare, Code2 } from "lucide-react";
import { PlatformIcon } from "@/components/PlatformIcons";

export type Quest = {
  id?: string;
  title: string;
  cr?: number;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  xp?: number;
  active?: boolean;
  url?: string;
  solution_link?: string;
  platform?: string;
  description?: string;
  topics?: string[];
  completed?: boolean;
};

export default function QuestCard({
  quest,
  index = 0,
  hideDetails = false,
  onHover,
  onBegin,
}: {
  quest: Quest;
  index?: number;
  hideDetails?: boolean;
  onHover?: () => void;
  onBegin?: () => void;
}) {
  const diff = quest.difficulty?.toLowerCase() || "easy";
  const diffBadgeClass =
    diff === "easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : diff === "medium"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return (
    <div
      onMouseEnter={onHover}
      className={`group relative flex flex-col justify-between rounded-lg border bg-zinc-900/60 p-4 transition-all hover:bg-zinc-900 hover:border-zinc-700 ${
        quest.completed
          ? "border-zinc-800/80"
          : "border-zinc-800"
      }`}
    >
      <div>
        {/* Header: Status, Difficulty, Platform, XP */}
        <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${diffBadgeClass}`}
            >
              {quest.difficulty}
            </span>

            {quest.platform && (
              <span className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                <PlatformIcon platform={quest.platform} className="w-3 h-3" />
                <span>{quest.platform}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {quest.completed ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Solved
              </span>
            ) : quest.xp ? (
              <span className="font-mono text-[11px] text-zinc-500">
                +{quest.xp} XP
              </span>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <Link
            href={quest.id ? `/quests/${quest.id}` : quest.url || "#"}
            className="font-medium text-sm text-zinc-100 group-hover:text-zinc-50 transition-colors flex items-center gap-2"
          >
            <span className="line-clamp-1">{quest.title}</span>
          </Link>
        </div>

        {/* Topics */}
        {quest.topics && quest.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {quest.topics.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800/60"
              >
                {t}
              </span>
            ))}
            {quest.topics.length > 3 && (
              <span className="text-[10px] font-mono text-zinc-500 self-center">
                +{quest.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/60">
        {!hideDetails && quest.id && (
          <Link
            href={`/quests/${quest.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <FileCode2 className="h-3 w-3 text-zinc-400" />
            Specs
          </Link>
        )}

        <Link
          href={quest.id ? `/quests/${quest.id}` : quest.url || "#"}
          onClick={onBegin}
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors flex-1 justify-center shadow-sm"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Solve</span>
        </Link>

        {quest.url && (
          <a
            href={quest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            title={`Open on ${quest.platform || "official platform"}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {quest.solution_link && (
          <a
            href={quest.solution_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-amber-300 hover:border-zinc-700 transition-colors"
            title="View Solution"
          >
            <Lightbulb className="h-3.5 w-3.5" />
          </a>
        )}

        <Link
          href="/forums"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          title="Discuss"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}