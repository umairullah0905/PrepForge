"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Hash,
  ArrowLeftRight,
  Maximize2,
  Layers,
  Search,
  GitBranch,
} from "lucide-react";

export type Topic = {
  name: string;
  status: "completed" | "current" | "locked";
  count: number;
  completedCount?: number;
};

// Map each topic to a distinct relevant icon
const TOPIC_ICONS: Record<string, React.ReactNode> = {
  "Arrays & Hashing": <Hash className="h-4 w-4 text-emerald-400" />,
  "Two Pointers": <ArrowLeftRight className="h-4 w-4 text-amber-400" />,
  "Sliding Window": <Maximize2 className="h-4 w-4 text-cyan-400" />,
  "Stack & Queue": <Layers className="h-4 w-4 text-purple-400" />,
  "Stack": <Layers className="h-4 w-4 text-purple-400" />,
  "Binary Search": <Search className="h-4 w-4 text-rose-400" />,
  "Trees & Graphs": <GitBranch className="h-4 w-4 text-indigo-400" />,
  "Linked List": <GitBranch className="h-4 w-4 text-blue-400" />,
};

export default function QuestMap({
  topics = [],
}: {
  topics: Topic[];
  muted?: boolean;
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {topics.map((topic, i) => {
          const isCompleted = topic.status === "completed";
          const isCurrent = topic.status === "current";
          const topicIcon = TOPIC_ICONS[topic.name] || <Hash className="h-4 w-4 text-zinc-400" />;

          return (
            <Link
              key={topic.name}
              href={`/dsa?topic=${encodeURIComponent(topic.name)}`}
              className={`group flex flex-col justify-between rounded-xl border p-4.5 transition-all ${
                isCurrent
                  ? "border-zinc-600 bg-zinc-900 shadow-md ring-1 ring-zinc-700"
                  : isCompleted
                  ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-950 border border-zinc-800">
                      {topicIcon}
                    </div>
                    <span className="font-mono text-xs font-semibold text-zinc-400">
                      0{i + 1}
                    </span>
                  </div>

                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-600" />
                  )}
                </div>

                <div className="font-semibold text-sm sm:text-base text-zinc-100 group-hover:text-white transition-colors line-clamp-1 mb-2">
                  {topic.name}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs font-mono text-zinc-400">
                <span className="text-zinc-300 font-medium">{topic.count} questions</span>
                <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
