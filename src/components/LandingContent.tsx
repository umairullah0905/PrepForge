"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import QuestMap, { type Topic } from "@/components/QuestMap";
import TopicCard from "@/components/TopicCard";
import { type Profile, xpProgressPercent } from "@/lib/progress";
import {
  CheckCircle2,
  Circle,
  Search,
  ExternalLink,
  ArrowRight,
  Terminal,
  Binary,
  Building2,
  Network,
  Check,
} from "lucide-react";

const DEFAULT_TOPICS: Topic[] = [
  { name: "Arrays & Hashing", status: "completed", count: 12 },
  { name: "Two Pointers", status: "current", count: 9 },
  { name: "Sliding Window", status: "locked", count: 6 },
  { name: "Stack & Queue", status: "locked", count: 7 },
  { name: "Binary Search", status: "locked", count: 8 },
  { name: "Trees & Graphs", status: "locked", count: 15 },
];

export default function LandingContent({
  userEmail,
  profile,
  completedQuestTitles = [],
  signOutAction,
  questions = [],
}: {
  userEmail: string | null;
  profile: Profile | null;
  completedQuestTitles: string[];
  signOutAction: () => void;
  questions: any[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");

  const isLoggedIn = !!userEmail;
  const completedCount = completedQuestTitles.length;
  const totalQuestions = questions.length;

  // Breakdown of solved counts by difficulty
  const solvedStats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;

    const completedSet = new Set(completedQuestTitles);
    questions.forEach((q) => {
      if (completedSet.has(q.title)) {
        const d = q.difficulty?.toUpperCase();
        if (d === "EASY") easy++;
        else if (d === "MEDIUM") medium++;
        else if (d === "HARD") hard++;
      }
    });

    return { easy, medium, hard };
  }, [questions, completedQuestTitles]);

  // Filtered problems for the main table
  const filteredProblems = useMemo(() => {
    return questions.filter((q) => {
      if (difficultyFilter !== "ALL" && q.difficulty?.toUpperCase() !== difficultyFilter) {
        return false;
      }
      if (platformFilter !== "ALL" && q.platform?.toUpperCase() !== platformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = q.title?.toLowerCase().includes(query);
        const matchTopic = q.topics?.some((t: string) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchTopic) return false;
      }
      return true;
    });
  }, [questions, difficultyFilter, platformFilter, searchQuery]);

  return (
    <div className="qx-root flex flex-col min-h-screen">
      {/* Top Developer Navbar */}
      <Navbar
        userEmail={userEmail}
        profile={profile}
        completedCount={completedCount}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-20">
        <div className="qx-container pt-8 sm:pt-10">
          {/* USER DASHBOARD SUMMARY (Logged In State) - Full UI Width */}
          {isLoggedIn && profile ? (
            <section className="mb-12 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-6 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg font-bold text-zinc-100">
                      {profile.name || userEmail}
                    </span>
                    <span className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs font-semibold text-zinc-300">
                      Developer Tier: L{profile.level}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400 font-mono mt-1">
                    {userEmail}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3.5">
                  {profile.leetcode_username && (
                    <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs sm:text-sm font-mono text-zinc-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      LC: {profile.leetcode_username}
                    </span>
                  )}
                  {profile.codeforces_username && (
                    <span className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs sm:text-sm font-mono text-zinc-300">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      CF: {profile.codeforces_username}
                    </span>
                  )}
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>Account Settings</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* 4 Metric Cards - Larger font sizes and wider grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Total Solved
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                      {completedCount}
                    </span>
                    <span className="text-sm font-mono text-zinc-500">
                      / {totalQuestions}
                    </span>
                  </div>
                  <div className="mt-3.5 h-2 w-full rounded-full bg-zinc-850 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Difficulty Breakdown
                  </div>
                  <div className="flex items-center gap-4 mt-2 font-mono text-sm font-medium">
                    <span className="text-emerald-400">Easy: {solvedStats.easy}</span>
                    <span className="text-amber-400">Med: {solvedStats.medium}</span>
                    <span className="text-rose-400">Hard: {solvedStats.hard}</span>
                  </div>
                  <div className="mt-3.5 flex h-2 w-full rounded-full bg-zinc-850 overflow-hidden gap-0.5">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${completedCount > 0 ? (solvedStats.easy / completedCount) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${completedCount > 0 ? (solvedStats.medium / completedCount) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-rose-500"
                      style={{
                        width: `${completedCount > 0 ? (solvedStats.hard / completedCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Experience Points
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
                      {profile.xp.toLocaleString()}
                    </span>
                    <span className="text-sm font-mono text-zinc-500">XP</span>
                  </div>
                  <div className="mt-3 text-xs font-mono text-zinc-400 flex justify-between">
                    <span>Level {profile.level}</span>
                    <span>{xpProgressPercent(profile.xp).toFixed(0)}% to L{profile.level + 1}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                    Platform Sync
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm sm:text-base font-semibold text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>Sync Active</span>
                  </div>
                  <div className="mt-3 text-xs font-mono text-zinc-500">
                    Live verification enabled
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* TECHNICAL HERO FOR VISITORS - Full UI Width */
            <section className="mb-14 pt-4 pb-10 border-b border-zinc-800/80">
              <div className="w-full">
                <div className="inline-flex items-center gap-2.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs sm:text-sm font-mono text-zinc-300 mb-6">
                  <Terminal className="h-4 w-4 text-zinc-400" />
                  <span>PREPFORGE OS • High-Yield Technical Interview Engineering</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 mb-4 max-w-5xl leading-[1.15]">
                  Engineered for algorithmic mastery.
                </h1>

                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-4xl mb-8">
                  High-density practice environment integrating LeetCode and Codeforces archives with automated verification. Structured pattern trees, zero gamified clutter.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/dsa"
                    className="inline-flex items-center gap-2.5 rounded-md bg-zinc-100 px-5 py-2.5 text-sm sm:text-base font-semibold text-zinc-950 hover:bg-white transition-colors shadow-sm"
                  >
                    <span>Browse All Problems</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm sm:text-base font-medium text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700 transition-colors"
                  >
                    <span>Sign In &amp; Link Accounts</span>
                  </Link>
                </div>
              </div>

              {/* Technical summary specs banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-zinc-850 text-sm font-mono">
                <div>
                  <div className="text-zinc-500 text-xs uppercase font-semibold">PROBLEMS INDEXED</div>
                  <div className="text-zinc-100 font-bold text-base sm:text-lg mt-1">{totalQuestions}+ Verified</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase font-semibold">CURRICULUM PATTERNS</div>
                  <div className="text-zinc-100 font-bold text-base sm:text-lg mt-1">18 Core Trees</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase font-semibold">INTEGRATIONS</div>
                  <div className="text-zinc-100 font-bold text-base sm:text-lg mt-1">LeetCode &amp; Codeforces</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase font-semibold">VERIFICATION</div>
                  <div className="text-zinc-100 font-bold text-base sm:text-lg mt-1">Automated Sync</div>
                </div>
              </div>
            </section>
          )}

          {/* CURATED TRACKS - Distinct Icons & Expanded Grid */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  Curated Practice Tracks
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 mt-1">
                  High-yield syllabus organized by interview frequency and prerequisite trees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TopicCard
                href="/dsa"
                eyebrow="TRACK_01"
                trackType="dsa"
                title="Data Structures & Algorithms"
                description="Core algorithmic patterns from sliding window and two pointers through dynamic programming and graph traversals."
                level="CORE CURRICULUM"
                problemCount={totalQuestions}
              />
              <TopicCard
                href="/dsa?tab=companies"
                eyebrow="TRACK_02"
                trackType="companies"
                title="Company Tagged Archives"
                description="Real interview questions tagged by company frequency including Google, Meta, Amazon, Apple, and Bloomberg."
                level="INTERVIEW ARCHIVE"
                problemCount={200}
              />
              <TopicCard
                href="/system-design"
                eyebrow="TRACK_03"
                trackType="system-design"
                title="System Design Architecture"
                description="Distributed systems, horizontal scalability, partitioning, caching strategies, and consensus protocols."
                level="ADVANCED"
                problemCount={25}
              />
            </div>
          </section>

          {/* NEETCODE-STYLE ROADMAP PROGRESSION - Full Width */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  Pattern Progression Map
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 mt-1">
                  Sequential mastery sequence. Clear prerequisite patterns before advancing to complex problems.
                </p>
              </div>
            </div>

            <QuestMap topics={DEFAULT_TOPICS} />
          </section>

          {/* MAIN PROBLEM TABLE (LeetCode / NeetCode High-Density UX) */}
          <section className="mb-16" id="board">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  Problem Set Archive
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 mt-1">
                  Showing {filteredProblems.length} available problems in active index.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or topic..."
                    className="h-10 w-56 sm:w-72 rounded-lg border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  />
                </div>

                {/* Difficulty tabs */}
                <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 text-sm font-mono">
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
              </div>
            </div>

            {/* Dense High-Density Table - Expanded UI */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-5 w-16 text-center">Status</th>
                      <th className="py-3 px-5">Title &amp; Topics</th>
                      <th className="py-3 px-5 w-32">Difficulty</th>
                      <th className="py-3 px-5 w-32">Platform</th>
                      <th className="py-3 px-5 w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredProblems.slice(0, 15).map((q, idx) => {
                      const isCompleted = completedQuestTitles.includes(q.title);
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
                          {/* Status */}
                          <td className="py-3.5 px-5 text-center">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400 inline-block" />
                            ) : (
                              <Circle className="h-5 w-5 text-zinc-600 inline-block group-hover:text-zinc-500" />
                            )}
                          </td>

                          {/* Title & Topics */}
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

                          {/* Difficulty */}
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${diffClass}`}
                            >
                              {q.difficulty}
                            </span>
                          </td>

                          {/* Platform */}
                          <td className="py-3.5 px-5 font-mono text-zinc-400 text-xs sm:text-sm">
                            {q.platform || "LeetCode"}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
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

                    {filteredProblems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-500 font-mono text-sm">
                          No problems found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 text-sm font-mono text-zinc-400">
                <span>
                  Showing {Math.min(15, filteredProblems.length)} of {filteredProblems.length} problems
                </span>
                <Link
                  href="/dsa"
                  className="inline-flex items-center gap-1.5 text-zinc-200 hover:text-white font-sans font-medium transition-colors"
                >
                  <span>Open Full Directory</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Clean Technical Footer - Full Width */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10 text-sm font-mono text-zinc-500">
        <div className="qx-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-200 font-bold font-sans">PREPFORGE</span>
            <span>— Precision Interview Engineering System</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dsa" className="hover:text-zinc-300 transition-colors">
              Problems
            </Link>
            <Link href="/dsa?tab=companies" className="hover:text-zinc-300 transition-colors">
              Companies
            </Link>
            <Link href="/system-design" className="hover:text-zinc-300 transition-colors">
              System Design
            </Link>
            <Link href="/forums" className="hover:text-zinc-300 transition-colors">
              Discussions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}