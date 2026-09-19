import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import Navbar from "@/components/Navbar";
import { signOutAction } from "../actions";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/utils/supabase/config";
import {
  Search,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const revalidate = 0;

export default async function CompanyQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; topic?: string; page?: string }>;
}) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="p-8 text-xs font-mono text-rose-400">
        Missing Supabase environment variables.
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const rawCompany = resolvedParams.company || "";
  const topicFilter = resolvedParams.topic || "";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const itemsPerPage = 20;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  let { data: allQuestions, error } = await supabase
    .from("company_questions")
    .select("id, title, difficulty, company_names, topics, link")
    .order("title", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-xs font-mono text-rose-400">
        Error fetching questions: {error.message}.
      </div>
    );
  }

  let questions = allQuestions || [];

  if (rawCompany) {
    const searchCompany = rawCompany.toLowerCase();
    questions = questions.filter((q) =>
      q.company_names?.some((c: string) => c.toLowerCase().includes(searchCompany))
    );
  }

  if (topicFilter) {
    const searchTopic = topicFilter.toLowerCase();
    questions = questions.filter((q) =>
      q.topics?.toLowerCase().includes(searchTopic)
    );
  }

  const totalQuestions = questions.length;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = questions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="qx-root flex flex-col min-h-screen">
      <Navbar
        userEmail={user?.email ?? null}
        profile={profile}
        completedCount={completedTitles.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-16">
        <div className="qx-container pt-8">
          <div className="pb-6 mb-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span className="text-zinc-300">Company Tagged Questions</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Company Interview Archives
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Targeted interview questions cataloged by company frequency.
            </p>
          </div>

          {/* Search toolbar */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 mb-6">
            <form method="GET" className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label
                  htmlFor="company-input"
                  className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5"
                >
                  Company Name
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    name="company"
                    id="company-input"
                    defaultValue={rawCompany}
                    placeholder="e.g. Google, Apple, Amazon, Meta"
                    className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="topic-input"
                  className="block font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5"
                >
                  Topic / Pattern
                </label>
                <input
                  type="text"
                  name="topic"
                  id="topic-input"
                  defaultValue={topicFilter}
                  placeholder="e.g. Array, Hash Table, Dynamic Programming"
                  className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="submit"
                  className="h-9 rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
                >
                  Filter
                </button>
                {(rawCompany || topicFilter) && (
                  <Link
                    href="/company-questions"
                    className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center justify-center"
                  >
                    Reset
                  </Link>
                )}
              </div>
            </form>

            <div className="mt-2 text-[11px] font-mono text-zinc-500">
              Showing {totalQuestions} total questions matching criteria.
            </div>
          </div>

          {/* Questions Table */}
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center text-xs font-mono text-zinc-500">
              No questions found matching your filter criteria.
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-1/4">Companies</th>
                      <th className="py-2.5 px-4 w-2/5">Problem Title</th>
                      <th className="py-2.5 px-4 w-28">Difficulty</th>
                      <th className="py-2.5 px-4">Topics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {paginatedQuestions.map((q) => {
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
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {q.company_names?.slice(0, 4).map((c: string) => (
                                <span
                                  key={c}
                                  className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-800"
                                >
                                  {c}
                                </span>
                              ))}
                              {q.company_names?.length > 4 && (
                                <span className="text-[10px] font-mono text-zinc-500 self-center">
                                  +{q.company_names.length - 4}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <a
                              href={q.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-zinc-200 group-hover:text-zinc-50 hover:underline inline-flex items-center gap-1.5"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              ) : null}
                              <span>{q.title}</span>
                              <ExternalLink className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${diffClass}`}
                            >
                              {q.difficulty}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {q.topics ? (
                                q.topics.split(",").map((t: string) => (
                                  <span
                                    key={t.trim()}
                                    className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800/60"
                                  >
                                    {t.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-600 font-mono">-</span>
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400">
                  <div>
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + itemsPerPage, totalQuestions)} of {totalQuestions}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={`/company-questions?company=${encodeURIComponent(
                          rawCompany
                        )}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage - 1}`}
                        className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Prev</span>
                      </Link>
                    )}
                    <span className="text-zinc-500">
                      {currentPage} / {totalPages}
                    </span>
                    {currentPage < totalPages && (
                      <Link
                        href={`/company-questions?company=${encodeURIComponent(
                          rawCompany
                        )}&topic=${encodeURIComponent(topicFilter)}&page=${currentPage + 1}`}
                        className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
