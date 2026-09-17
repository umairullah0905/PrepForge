"use client";

import { useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TopicCard from "@/components/TopicCard";
import ContestCalendar from "@/components/ContestCalendar";
import QuestCard from "@/components/QuestCard";
import { type Profile, xpProgressPercent } from "@/lib/progress";
import { type Contest } from "@/lib/contests";
import { ArrowRight, Terminal, Lock, Code2 } from "lucide-react";

export default function LandingContent({
  userEmail,
  profile,
  completedQuestTitles = [],
  signOutAction,
  questions = [],
  contests = [],
}: {
  userEmail: string | null;
  profile: Profile | null;
  completedQuestTitles: string[];
  signOutAction: () => void;
  questions: any[];
  contests?: Contest[];
}) {
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

  // Preview a few questions (first 6) for the home page
  const previewQuestions = useMemo(() => {
    const completedSet = new Set(completedQuestTitles);
    return questions.slice(0, 6).map((q) => ({
      ...q,
      completed: completedSet.has(q.title),
    }));
  }, [questions, completedQuestTitles]);

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
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                  <div className="text-xs font-medium text-zinc-400">
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

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                  <div className="text-xs font-medium text-zinc-400">
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

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                  <div className="text-xs font-medium text-zinc-400">
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

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                  <div className="text-xs font-medium text-zinc-400">
                    Platform Sync
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm sm:text-base font-semibold text-zinc-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>Sync Active</span>
                  </div>
                  <div className="mt-3 text-xs font-mono text-zinc-400">
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

          {/* UPCOMING CONTESTS CALENDAR (Logged In Only) */}
          {isLoggedIn && <ContestCalendar initialContests={contests} />}

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

          {/* FEATURED PRACTICE PROBLEMS (Few visible on Home) */}
          {previewQuestions.length > 0 && (
            <section className="mb-14">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs font-mono text-zinc-300 mb-2">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>CURRICULUM_PREVIEW</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                    Featured Practice Problems
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {isLoggedIn
                      ? "Hand-picked high-yield problems from top tech company interview patterns."
                      : "Preview a sample of questions below. Sign in to unlock the complete archive."}
                  </p>
                </div>

                {isLoggedIn && (
                  <Link
                    href="/dsa"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>View All Problems ({totalQuestions})</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Grid of sample questions (few visible) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewQuestions.map((quest, idx) => (
                  <QuestCard key={quest.id || idx} quest={quest} />
                ))}
              </div>

              {/* If NOT logged in: Lock banner asking to sign in to see all */}
              {!isLoggedIn && (
                <div className="relative mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 text-center backdrop-blur-sm shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 mb-4">
                    <Lock className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-100 mb-2">
                    Want to see all {totalQuestions}+ practice questions?
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-6 leading-relaxed">
                    Sign in to unlock our full problem database, company-tagged archives (Google, Amazon, Meta), live code verification, contest schedules, and sync your LeetCode and Codeforces progress.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white transition-colors shadow-sm"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Sign In to See All Questions</span>
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-850 transition-colors"
                    >
                      <span>Create Free Account</span>
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
}