import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";
import {
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
  FileCode2,
  Tag,
  Share2,
} from "lucide-react";

export const revalidate = 0;

export default async function QuestDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!question) {
    return (
      <div className="qx-root flex flex-col min-h-screen">
        <Navbar
          userEmail={user?.email ?? null}
          profile={profile}
          completedCount={completedTitles.length}
          signOutAction={signOutAction}
        />
        <div className="qx-container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3">
            <FileCode2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 mb-1">
            Problem Specification Not Found
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
            This problem could not be retrieved or has been relocated.
          </p>
          <Link
            href="/dsa"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3.5 py-2 text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Problem Set</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = completedTitles.includes(question.title);
  const diff = question.difficulty?.toLowerCase() || "easy";
  const diffClass =
    diff === "easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : diff === "medium"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return (
    <div className="qx-root flex flex-col min-h-screen">
      <Navbar
        userEmail={user?.email ?? null}
        profile={profile}
        completedCount={completedTitles.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-16">
        <div className="qx-container pt-6">
          {/* Breadcrumbs & Navigation */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-sm font-mono">
            <div className="flex items-center gap-2 text-zinc-500">
              <Link href="/dsa" className="hover:text-zinc-300 transition-colors">
                Problem Set
              </Link>
              <span>/</span>
              <span className="text-zinc-400">{question.platform || "LeetCode"}</span>
              <span>/</span>
              <span className="text-zinc-200 truncate max-w-[240px] sm:max-w-md">
                {question.title}
              </span>
            </div>

            <Link
              href="/dsa"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </Link>
          </div>

          {/* Problem Header Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span
                    className={`inline-flex items-center rounded border px-2.5 py-0.5 font-mono text-xs font-medium ${diffClass}`}
                  >
                    {question.difficulty}
                  </span>
                  <span className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
                    {question.platform || "LeetCode"}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400 font-medium ml-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Solved
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                  {question.title}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {question.solution_link && (
                  <a
                    href={question.solution_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-amber-300 transition-colors"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Editorial</span>
                  </a>
                )}

                <Link
                  href="/forums"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Discussion</span>
                </Link>

                {question.url && (
                  <a
                    href={question.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white transition-colors"
                  >
                    <span>Solve in IDE</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Topic Chips */}
            {question.topics && question.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-zinc-800/60">
                {question.topics.map((topic: string, i: number) => (
                  <span
                    key={i}
                    className="rounded bg-zinc-950 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-800/80"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Problem Statement Body (LeetCode / NeetCode High Contrast Dark Pane) */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
            <div className="prose prose-invert max-w-none text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .spec-content { color: #d4d4d8; font-size: 15px; line-height: 1.7; }
                  .spec-content p { margin-bottom: 1.25rem; }
                  .spec-content pre {
                    background: #121215;
                    border: 1px solid #27272a;
                    padding: 14px 18px;
                    border-radius: 6px;
                    font-family: var(--font-mono), monospace;
                    font-size: 13px;
                    overflow-x: auto;
                    color: #f4f4f5;
                    margin: 1.25rem 0;
                  }
                  .spec-content code {
                    background: #18181b;
                    border: 1px solid #27272a;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: var(--font-mono), monospace;
                    font-size: 13px;
                    color: #e4e4e7;
                  }
                  .spec-content ul { list-style-type: disc; margin-left: 1.75rem; margin-bottom: 1.25rem; }
                  .spec-content li { margin-bottom: 0.5rem; }
                  .spec-content strong { color: #fafafa; }
                  .spec-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 1.25rem 0; }
                `,
                }}
              />

              <div
                className="spec-content"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
