import { createClient } from "@/utils/supabase/server";
import LandingContent from "@/components/LandingContent";
import { signOutAction } from "./actions";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <LandingContent 
      userEmail={user?.email ?? null} 
      profile={profile}
      completedQuestTitles={completedTitles}
      signOutAction={signOutAction} 
      questions={questions || []} 
    />
  );
}