import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/utils/supabase/config";
import CommunityChat, { type ChatMessage } from "@/components/CommunityChat";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";

export const revalidate = 0;

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id, user_id, name, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const initialMessages: ChatMessage[] = (messageRows ?? [])
    .slice()
    .reverse();

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
          <div className="pb-6 mb-8 border-b border-zinc-800/80 text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Community Channels
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time engineering chat. Discuss solutions, debugging techniques, and interview preparation.
            </p>
          </div>

          <CommunityChat
            initialMessages={initialMessages}
            currentUserId={user?.id ?? null}
            currentUserName={profile?.name ?? user?.email ?? null}
            supabaseUrl={getSupabaseUrl()}
            supabaseAnonKey={getSupabaseAnonKey()}
          />
        </div>
      </main>
    </div>
  );
}
