import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";
import { ArrowLeft, FileCode2 } from "lucide-react";
import ProblemWorkspace from "@/components/ide/ProblemWorkspace";
import { getLeetCodeSnippets } from "@/lib/snippets";

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
      <div className="qx-root flex flex-col min-h-screen bg-zinc-950">
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

  // If problem is from LeetCode, fetch the official boilerplate code snippets
  let snippets: Record<string, string> = {};
  if (
    question.platform?.toLowerCase() === "leetcode" &&
    (question.url || question.platform_id)
  ) {
    snippets = await getLeetCodeSnippets(question.url || question.platform_id);
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950">
      <Navbar
        userEmail={user?.email ?? null}
        profile={profile}
        completedCount={completedTitles.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 w-full overflow-hidden">
        <ProblemWorkspace
          question={question}
          isInitiallyCompleted={isCompleted}
          userEmail={user?.email ?? null}
          initialSnippets={snippets}
        />
      </main>
    </div>
  );
}
