import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { getCachedQuestions, getCachedCompanyQuestions, normalizeTopicName } from "@/lib/questions";
import Navbar from "@/components/Navbar";
import ClientQuestsView from "../quests/ClientQuestsView";
import { signOutAction } from "../actions";
import {
  Search,
  Building2,
  Code2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const revalidate = 30;

export default async function DsaHubPage(props: {
  searchParams: Promise<{ tab?: string; company?: string; topic?: string; page?: string }>;
}) {
  const resolvedParams = await props.searchParams;
  const currentTab = resolvedParams.tab || "quests"; // 'quests' or 'companies'

  const rawCompany = resolvedParams.company || "";
  const topicFilter = resolvedParams.topic || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const itemsPerPage = 20;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Run user data and tab data in parallel with high-performance caching
  const [profile, completedTitles, questsData, rawCompanyData] = await Promise.all([
    user ? getProfile(supabase, user.id) : Promise.resolve(null),
    user ? getCompletedQuestTitles(supabase, user.id) : Promise.resolve([]),
    currentTab === "quests" ? getCachedQuestions() : Promise.resolve([]),
    currentTab === "companies" ? getCachedCompanyQuestions() : Promise.resolve([]),
  ]);

  let companyData = rawCompanyData;
  if (currentTab === "companies") {

    if (rawCompany) {
      const searchCompany = rawCompany.toLowerCase();
      companyData = companyData.filter((q: any) =>
        q.company_names?.some((c: string) => c.toLowerCase().includes(searchCompany))
      );
    }

    if (topicFilter) {
      const searchTopic = topicFilter.toLowerCase();
      companyData = companyData.filter((q: any) =>
        q.topics?.toLowerCase().includes(searchTopic)
      );
    }
  }

  const totalQuestions = companyData.length;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanyData = companyData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="qx-root flex flex-col min-h-screen">
      <Navbar
        userEmail={user?.email ?? null}
        profile={profile}
        completedCount={completedTitles.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-20">
        <div className="qx-container pt-8 sm:pt-10">
          {/* Header section - Full Width */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 mb-8 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                <Link href="/" className="hover:text-zinc-300 transition-colors">
                  Overview
                </Link>
                <span>/</span>
                <Link href="/dsa" className="hover:text-zinc-300 transition-colors">
                  Problems
                </Link>
                <span>/</span>
                <span className="text-zinc-200 font-medium">
                  {currentTab === "companies" ? "Company Archives" : "Pattern Quests"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Data Structures &amp; Algorithms
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
                Curated interview patterns, algorithm archives, and company frequency tagging.
              </p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
              <Link
                href="/dsa?tab=quests"
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  currentTab === "quests"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>Pattern Quests</span>
              </Link>
              <Link
                href="/dsa?tab=companies"
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  currentTab === "companies"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Company Archives</span>
              </Link>
            </div>
          </div>

          {/* TAB CONTENT */}
          {currentTab === "quests" ? (
            <ClientQuestsView questions={questsData} completedTitles={completedTitles} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Search & Filter Toolbar */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm">
                <form method="GET" action="/dsa" className="flex flex-col md:flex-row gap-4 items-end">
                  <input type="hidden" name="tab" value="companies" />

                  <div className="flex-1 w-full">
                    <label
                      htmlFor="company-input"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Company Filter
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        name="company"
                        id="company-input"
                        defaultValue={rawCompany}
                        placeholder="e.g. Google, Apple, Amazon, Meta"
                        className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <label
                      htmlFor="topic-input"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Topic / Pattern
                    </label>
                    <input
                      type="text"
                      name="topic"
                      id="topic-input"
                      defaultValue={topicFilter}
                      placeholder="e.g. Array, Dynamic Programming, Tree"
                      className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2.5 w-full md:w-auto">
                    <button
                      type="submit"
                      className="h-10 rounded-lg bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
                    >
                      Filter
                    </button>
                    {(rawCompany || topicFilter) && (
                      <Link
                        href="/dsa?tab=companies"
                        className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center justify-center"
                      >
                        Reset
                      </Link>
                    )}
                  </div>
                </form>

                <div className="mt-3 text-xs font-mono text-zinc-500">
                  Showing {totalQuestions} company-tagged questions matching criteria.
                </div>
              </div>

              {/* Company Questions Table */}
              {companyData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-16 text-center text-sm font-mono text-zinc-500">
                  No company questions found matching your filter criteria.
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                          <th className="py-3 px-5 w-1/4">Companies</th>
                          <th className="py-3 px-5 w-2/5">Problem Title</th>
                          <th className="py-3 px-5 w-32">Difficulty</th>
                          <th className="py-3 px-5">Topics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {paginatedCompanyData.map((q) => {
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
                              key={q.id}
                              className="hover:bg-zinc-900/80 transition-colors group"
                            >
                              <td className="py-3.5 px-5">
                                <div className="flex flex-wrap gap-1.5">
                                  {q.company_names?.slice(0, 4).map((c: string) => (
                                    <span
                                      key={c}
                                      className="rounded-md bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                  {q.company_names?.length > 4 && (
                                    <span className="text-xs font-mono text-zinc-400 self-center">
                                      +{q.company_names.length - 4}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-5">
                                <a
                                  href={q.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-sm sm:text-base text-zinc-200 group-hover:text-emerald-400 hover:underline inline-flex items-center gap-2 transition-colors"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  ) : null}
                                  <span>{q.title}</span>
                                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </td>

                              <td className="py-3.5 px-5">
                                <span
                                  className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${diffClass}`}
                                >
                                  {q.difficulty}
                                </span>
                              </td>

                              <td className="py-3.5 px-5">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                                  {q.topics ? (
                                    q.topics
                                      .split(",")
                                      .slice(0, 3)
                                      .map((t: string, idx: number, arr: string[]) => (
                                        <span key={idx} className="inline-flex items-center gap-1.5">
                                          <span className="text-zinc-400 hover:text-zinc-200 transition-colors">
                                            {normalizeTopicName(t.trim())}
                                          </span>
                                          {idx < arr.length - 1 && (
                                            <span className="text-zinc-600 select-none">·</span>
                                          )}
                                        </span>
                                      ))
                                  ) : (
                                    <span className="text-zinc-600 text-xs">-</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 text-sm font-mono text-zinc-400">
                      <div>
                        Showing {startIndex + 1} to{" "}
                        {Math.min(startIndex + itemsPerPage, totalQuestions)} of {totalQuestions}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {currentPage > 1 && (
                          <Link
                            href={`/dsa?tab=companies&company=${encodeURIComponent(
                              rawCompany
                            )}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage - 1}`}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Prev</span>
                          </Link>
                        )}
                        <span className="text-zinc-400">
                          {currentPage} / {totalPages}
                        </span>
                        {currentPage < totalPages && (
                          <Link
                            href={`/dsa?tab=companies&company=${encodeURIComponent(
                              rawCompany
                            )}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage + 1}`}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
