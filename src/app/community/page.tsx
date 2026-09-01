import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CommunityChat, { type ChatMessage } from "@/components/CommunityChat";
import { getProfile } from "@/lib/progress";

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id, user_id, name, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const initialMessages: ChatMessage[] = (messageRows ?? [])
    .slice()
    .reverse();

  return (
    <div className="qx-root">
      <nav className="qx-nav">
        <Link
          href="/"
          className="qx-logo"
          style={{ textDecoration: "none" }}
        >
          <div className="qx-logo-mark">⚔️</div>
          <span className="qx-display qx-logo-text">DSA QUESTS</span>
        </Link>
        <div className="qx-navlinks">
          <Link href="/">← Back to Quest Board</Link>
        </div>
      </nav>

      <div
        className="qx-container"
        style={{ padding: "56px 24px", position: "relative", zIndex: 1 }}
      >
        <div className="qx-section-head">
          <h1 className="qx-pixel qx-section-title">🏰 Community Hall</h1>
          <p className="qx-section-desc">
            Talk strategy, brag about a quest you just cleared, ask for help.
          </p>
        </div>

        <CommunityChat
          initialMessages={initialMessages}
          currentUserId={user?.id ?? null}
          currentUserName={profile?.name ?? user?.email ?? null}
        />
      </div>

      <footer className="qx-footer">DSA Quests — built one dungeon at a time</footer>
    </div>
  );
}
