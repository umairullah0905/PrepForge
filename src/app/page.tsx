import { createClient } from "@/utils/supabase/server";
import LandingContent from "@/components/LandingContent";
import { signOutAction } from "./actions";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { getCachedQuestions } from "@/lib/questions";

export const revalidate = 30;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallelize user profile, completed titles, and cached questions query
  const [profile, completedTitles, questions] = await Promise.all([
    user ? getProfile(supabase, user.id) : Promise.resolve(null),
    user ? getCompletedQuestTitles(supabase, user.id) : Promise.resolve([]),
    getCachedQuestions(),
  ]);

  return (
    <LandingContent
      userEmail={user?.email ?? null}
      profile={profile}
      completedQuestTitles={completedTitles}
      signOutAction={signOutAction}
      questions={questions}
    />
  );
}