import { createClient } from "@/utils/supabase/server";
import LandingContent from "@/components/LandingContent";
import { signOutAction } from "./actions";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <LandingContent 
      userEmail={user?.email ?? null} 
      signOutAction={signOutAction} 
      questions={questions || []} 
    />
  );
}