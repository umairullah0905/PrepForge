"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileUsernames } from "@/app/profile-actions";
import { syncExternalProfilesAction } from "@/app/sync-actions";
import { RefreshCw, CheckCircle2, AlertCircle, Link2 } from "lucide-react";

export default function ProfileSyncForm({
  initialLeetcode,
  initialCodeforces,
}: {
  initialLeetcode?: string;
  initialCodeforces?: string;
}) {
  const router = useRouter();
  const [leetcode, setLeetcode] = useState(initialLeetcode || "");
  const [codeforces, setCodeforces] = useState(initialCodeforces || "");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);

  const handleSaveAndSync = async () => {
    setStatus({ type: "loading", message: "Saving handles and querying platform APIs..." });

    try {
      // 1. Save usernames
      const saveRes = await updateProfileUsernames(leetcode, codeforces);
      if (!saveRes.ok) {
        setStatus({
          type: "error",
          message: saveRes.error || "Failed to save profile handles.",
        });
        return;
      }

      // 2. Synchronize external profiles
      const syncRes = await syncExternalProfilesAction(leetcode, codeforces);
      if (!syncRes.ok) {
        setStatus({
          type: "error",
          message: syncRes.error || "Failed to synchronize accounts.",
        });
        return;
      }

      // 3. Immediately refresh the router to update server component data
      router.refresh();

      setStatus({
        type: "success",
        message: `Handles saved successfully! Synchronized ${syncRes.newlyCompleted} new verified problem(s).`,
      });
    } catch (err: any) {
      console.error("Profile sync exception:", err);
      setStatus({
        type: "error",
        message: err.message || "An unexpected error occurred during sync.",
      });
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="h-4 w-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-100">
          Connected Accounts &amp; Live Verification
        </h3>
      </div>
      <p className="text-xs text-zinc-400 mb-5 leading-relaxed max-w-xl">
        Link your LeetCode and Codeforces handles. When you solve a problem on either platform, your progress and XP are automatically synchronized and saved to your database.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-4">
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
            LeetCode Handle
          </label>
          <input
            type="text"
            value={leetcode}
            onChange={(e) => setLeetcode(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
            placeholder="e.g. neetcode"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
            Codeforces Handle
          </label>
          <input
            type="text"
            value={codeforces}
            onChange={(e) => setCodeforces(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
            placeholder="e.g. tourist"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveAndSync}
          disabled={status?.type === "loading"}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${status?.type === "loading" ? "animate-spin" : ""}`}
          />
          <span>{status?.type === "loading" ? "Saving & Syncing..." : "Save & Sync Records"}</span>
        </button>
      </div>

      {status && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md p-3 text-xs font-mono ${
            status.type === "error"
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
              : status.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-zinc-700 bg-zinc-850 text-zinc-300"
          }`}
        >
          {status.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          ) : status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
