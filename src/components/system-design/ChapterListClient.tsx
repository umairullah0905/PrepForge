"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  Filter,
  CheckCircle2,
  Cpu,
  Server,
  Network,
  Database,
  Sparkles,
} from "lucide-react";
import type { ChapterSummary } from "@/lib/system-design";

interface ChapterListClientProps {
  chapters: ChapterSummary[];
  completedSlugs?: string[];
}

export default function ChapterListClient({
  chapters,
  completedSlugs = [],
}: ChapterListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  const categories = [
    "All",
    "Fundamentals",
    "Building Blocks",
    "Services & Scale",
    "Enterprise Systems",
  ];

  const difficulties = ["All", "Fundamentals", "Medium", "Hard"];

  const filteredChapters = useMemo(() => {
    return chapters.filter((ch) => {
      // Category filter
      if (selectedCategory !== "All" && ch.category !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== "All") {
        if (
          selectedDifficulty === "Fundamentals" &&
          ch.difficulty !== "Fundamentals" &&
          ch.difficulty !== "Interview Framework"
        ) {
          return false;
        } else if (
          selectedDifficulty !== "Fundamentals" &&
          ch.difficulty !== selectedDifficulty
        ) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = ch.title.toLowerCase().includes(q);
        const inTopics = ch.topics.some((t) => t.toLowerCase().includes(q));
        const inScale = ch.scale.toLowerCase().includes(q);
        return inTitle || inTopics || inScale;
      }
      return true;
    });
  }, [chapters, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search chapters by title or topic (e.g. Redis, Consistent Hashing, Sharding)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm"
                    : "bg-zinc-950/80 text-zinc-400 border border-zinc-850 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
        <span>
          Showing {filteredChapters.length} of {chapters.length} System Design
          Chapters
          {completedSlugs.length > 0 && (
            <span className="text-emerald-400 font-medium ml-2 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 inline" />
              {completedSlugs.length} completed
            </span>
          )}
        </span>
        <span className="hidden sm:inline">
          Reference Source: ByteByteGo (Alex Xu)
        </span>
      </div>

      {/* Chapter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChapters.map((c) => {
          const isCompleted = completedSlugs.includes(c.slug);
          const diffClass =
            c.difficulty.toLowerCase() === "fundamentals" ||
            c.difficulty.toLowerCase() === "interview framework"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : c.difficulty.toLowerCase() === "medium"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20";

          return (
            <div
              key={c.slug}
              className={`group rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all shadow-sm ${
                isCompleted
                  ? "border-emerald-500/30 bg-emerald-500/[0.02] hover:border-emerald-500/50"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700/90 hover:bg-zinc-900/50"
              }`}
            >
              <div>
                {/* Card Top Pill Row */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      Ch. {c.chapterNumber}
                    </span>
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${diffClass}`}
                    >
                      {c.difficulty}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {c.readTimeMinutes}
                  </span>
                </div>

                {/* Chapter Title */}
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                  <Link href={`/system-design/${c.slug}`}>{c.title}</Link>
                </h3>

                {/* Target Scale Metric */}
                <div className="text-xs font-mono text-zinc-400 mb-4 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Scale: {c.scale}</span>
                </div>

                {/* Key Topic Chips */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {c.topics.slice(0, 4).map((topic, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[11px] font-mono text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                    >
                      {topic}
                    </span>
                  ))}
                  {c.topics.length > 4 && (
                    <span className="rounded-md bg-zinc-800/50 px-2 py-0.5 text-[11px] font-mono text-zinc-500">
                      +{c.topics.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                <a
                  href={c.byteByteGoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Open reference on ByteByteGo"
                >
                  <span>ByteByteGo Ref</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <Link
                  href={`/system-design/${c.slug}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors"
                >
                  <span>Study Spec</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredChapters.length === 0 && (
        <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900/20">
          <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <div className="text-zinc-300 font-medium">No chapters match your criteria</div>
          <p className="text-zinc-500 text-xs mt-1">
            Try adjusting your search terms or clearing the filter pills.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedDifficulty("All");
            }}
            className="mt-4 inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
