import { createClient } from "@/utils/supabase/server";
import ClientQuestsView from "./ClientQuestsView";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { getCachedQuestions } from "@/lib/questions";
import Navbar from "@/components/Navbar";
import { signOutAction } from "../actions";

export const revalidate = 30;

export default async function QuestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, completedTitles, questions] = await Promise.all([
    user ? getProfile(supabase, user.id) : Promise.resolve(null),
    user ? getCompletedQuestTitles(supabase, user.id) : Promise.resolve([]),
    getCachedQuestions(),
  ]);

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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Problem Directory
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Complete archive of algorithmic practice problems filterable by topic category, status, and difficulty.
            </p>
          </div>

          <ClientQuestsView questions={questions || []} completedTitles={completedTitles} />
        </div>
      </main>
    </div>
  );
}
