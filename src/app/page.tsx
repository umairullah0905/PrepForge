import { createClient } from "@/utils/supabase/server";
import LandingContent from "@/components/LandingContent";
import { signOutAction } from "./actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LandingContent userEmail={user?.email ?? null} signOutAction={signOutAction} />
  );
}