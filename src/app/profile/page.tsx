import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  getProfile,
  getQuestProgressRows,
  xpProgressPercent,
} from "@/lib/progress";
import Navbar from "@/components/Navbar";
import ProfileSyncForm from "./ProfileSyncForm";
import { signOutAction } from "@/app/actions";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, history] = await Promise.all([
    getProfile(supabase, user.id),
    getQuestProgressRows(supabase, user.id),
  ]);

  const totalXp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;

  return (
    <div className="qx-root flex flex-col min-h-screen">
      <Navbar
        userEmail={user.email}
        profile={profile}
        completedCount={history.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-20">
        <div className="qx-container pt-8 sm:pt-10">
          {/* Header & Identity Card - Full Width */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-xl bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-zinc-100 font-mono text-2xl font-bold shadow-sm">
                  {(profile?.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                      {profile?.name || user.email?.split("@")[0]}
                    </h1>
                    <span className="rounded border border-zinc-750 bg-zinc-950 px-3 py-1 font-mono text-xs font-semibold text-zinc-300">
                      Tier L{level}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400 font-mono mt-1">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/dsa"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Resume Practice</span>
                </Link>
              </div>
            </div>

            {/* Metric Row - Larger fonts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Verified Solved
                </div>
                <div className="text-3xl font-bold font-mono text-zinc-100 mt-2">
                  {history.length}
                </div>
                <div className="text-xs text-zinc-400 mt-1.5 font-mono">
                  Problems recorded in database
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Experience Rating
                </div>
                <div className="text-3xl font-bold font-mono text-zinc-100 mt-2">
                  {totalXp.toLocaleString()}{" "}
                  <span className="text-sm text-zinc-500 font-normal">XP</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1.5 font-mono">
                  Level {level} • {totalXp % 200}/200 to L{level + 1}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Platform Sync
                </div>
                <div className="text-base font-semibold text-emerald-400 mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Automated Webhooks</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1.5 font-mono">
                  LeetCode &amp; Codeforces active
                </div>
              </div>
            </div>
          </div>

          {/* Linked Accounts Component */}
          <ProfileSyncForm
            initialLeetcode={profile?.leetcode_username}
            initialCodeforces={profile?.codeforces_username}
          />

          {/* Submission History Table - Expanded full width */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 mt-8 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                  Submission History Log
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Chronological record of verified problems and experience points awarded.
                </p>
              </div>
              <span className="font-mono text-xs text-zinc-400 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1">
                {history.length} records
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-16 text-center text-sm font-mono text-zinc-500">
                No submissions verified yet. Begin solving problems in the DSA workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-5 w-16 text-center">Status</th>
                      <th className="py-3 px-5">Problem Name</th>
                      <th className="py-3 px-5 w-32">Score</th>
                      <th className="py-3 px-5 w-44 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/80 transition-colors">
                        <td className="py-3.5 px-5 text-center">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 inline-block" />
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-zinc-100 text-sm sm:text-base">
                          {row.quest_title}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-sm font-semibold text-emerald-400">
                          +{row.xp_earned} XP
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-zinc-400 text-xs sm:text-sm">
                          {new Date(row.completed_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
