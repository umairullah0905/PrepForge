"use client";

import { useState } from "react";
import { updateProfileUsernames } from "@/app/profile-actions";
import { syncExternalProfilesAction } from "@/app/sync-actions";
import { blipClick } from "@/lib/sound";

export default function ProfileSyncForm({
  initialLeetcode,
  initialCodeforces
}: {
  initialLeetcode?: string;
  initialCodeforces?: string;
}) {
  const [leetcode, setLeetcode] = useState(initialLeetcode || "");
  const [codeforces, setCodeforces] = useState(initialCodeforces || "");
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading", message: string } | null>(null);

  const handleSaveAndSync = async () => {
    blipClick();
    setStatus({ type: "loading", message: "Saving and syncing profiles..." });
    
    // Save usernames
    const saveRes = await updateProfileUsernames(leetcode, codeforces);
    if (!saveRes.ok) {
      setStatus({ type: "error", message: saveRes.error || "Failed to save profiles." });
      return;
    }

    // Sync
    const syncRes = await syncExternalProfilesAction(leetcode, codeforces);
    if (!syncRes.ok) {
      setStatus({ type: "error", message: syncRes.error || "Failed to sync." });
      return;
    }

    setStatus({ 
      type: "success", 
      message: `Profiles saved! Synced ${syncRes.newlyCompleted} new quest(s).`
    });
  };

  return (
    <div className="qx-dash-card" style={{ marginTop: 24 }}>
      <div className="qx-pixel" style={{ fontSize: 20, marginBottom: 16 }}>Linked Accounts</div>
      <p className="qx-sub" style={{ fontSize: 13, marginBottom: 20 }}>
        Link your LeetCode and/or Codeforces accounts to automatically mark quests as completed when you solve them. You can link just one or both!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
        <div>
          <label className="qx-mono" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>LeetCode Username <span style={{ color: 'var(--text-dim)' }}>(Optional)</span></label>
          <input 
            type="text" 
            value={leetcode}
            onChange={e => setLeetcode(e.target.value)}
            className="qx-input"
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 4 }}
            placeholder="e.g. neetcode"
          />
        </div>
        <div>
          <label className="qx-mono" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>Codeforces Handle <span style={{ color: 'var(--text-dim)' }}>(Optional)</span></label>
          <input 
            type="text" 
            value={codeforces}
            onChange={e => setCodeforces(e.target.value)}
            className="qx-input"
            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: 4 }}
            placeholder="e.g. tourist"
          />
        </div>

        <button 
          onClick={handleSaveAndSync}
          disabled={status?.type === "loading"}
          style={{
            background: 'var(--mint)',
            color: 'var(--bg)',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 4,
            cursor: status?.type === "loading" ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            marginTop: 8
          }}
        >
          {status?.type === "loading" ? "Syncing..." : "Save & Sync Progress"}
        </button>

        {status && (
          <div style={{
            padding: 12,
            borderRadius: 4,
            fontSize: 13,
            backgroundColor: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : '#f3f4f6',
            color: status.type === 'error' ? '#991b1b' : status.type === 'success' ? '#166534' : '#374151',
          }}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
