import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  getProfile,
  getQuestProgressRows,
  xpProgressPercent,
} from "@/lib/progress";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  const history = await getQuestProgressRows(supabase, user.id);
  const totalXp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;

  return (
    <div className="qx-root">
      <nav className="qx-nav">
        <div className="qx-logo">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div className="qx-logo-mark">⚔️</div>
            <span className="qx-display qx-logo-text">DSA QUESTS</span>
          </Link>
        </div>
        <div className="qx-navlinks">
          <Link href="/">← Back to Quest Board</Link>
        </div>
      </nav>

      <div className="qx-container" style={{ padding: "56px 24px", position: "relative", zIndex: 1 }}>
        {/* profile header card */}
        <div className="qx-dash-card" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div className="player-avatar" style={{ width: 72, height: 72, fontSize: 34, borderRadius: 14 }}>
            🧝
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="qx-pixel" style={{ fontSize: 20, color: "var(--mint)" }}>
              {profile?.name ?? user.email}
            </div>
            <div className="qx-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              {user.email}
            </div>
            <div className="player-xp-row" style={{ marginTop: 14 }}>
              <span className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
                XP
              </span>
              <div className="player-xp-track" style={{ width: 220 }}>
                <div
                  className="player-xp-fill"
                  style={{ width: `${xpProgressPercent(totalXp)}%` }}
                />
              </div>
              <span className="qx-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                {totalXp % 200} / 200 to next level
              </span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="qx-pixel" style={{ fontSize: 32, color: "var(--gold)" }}>
              LVL {level}
            </div>
            <div className="qx-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
              {totalXp} total XP
            </div>
          </div>
        </div>

        {/* stats row */}
        <div className="qx-dash-grid" style={{ marginTop: 24 }}>
          <div className="qx-dash-card" style={{ textAlign: "center" }}>
            <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
              QUESTS COMPLETED
            </div>
            <div className="qx-pixel" style={{ fontSize: 28, color: "var(--mint)", marginTop: 8 }}>
              {history.length}
            </div>
          </div>
          <div className="qx-dash-card">
            <div className="qx-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>
              QUEST HISTORY
            </div>
            {history.length === 0 ? (
              <p className="qx-sub" style={{ fontSize: 13, margin: 0, textAlign: "left" }}>
                No quests completed yet — head back to the board and begin one.
              </p>
            ) : (
              <ul className="qx-dash-list">
                {history.map((row) => (
                  <li key={row.quest_title} style={{ justifyContent: "space-between" }}>
                    <span>✅ {row.quest_title}</span>
                    <span className="qx-mono" style={{ color: "var(--mint)" }}>
                      +{row.xp_earned} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <footer className="qx-footer">DSA Quests — built one dungeon at a time</footer>
    </div>
  );
}
