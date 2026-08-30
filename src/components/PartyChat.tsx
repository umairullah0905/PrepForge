"use client";

import { useState } from "react";
import { blipClick } from "@/lib/sound";

const ACTIVITY_LOG = [
  { name: "Thorin", color: "#F59E0B", time: "21m", text: "Cleared Reverse a Linked List 🔥" },
  { name: "Maraluth", color: "#8B5CF6", time: "34m", text: "Anyone else stuck on Trapping Rain Water?" },
  { name: "Nell the Wise", color: "#22C55E", time: "47m", text: "Party quest tomorrow, who's in?" },
];

export default function PartyChat({ muted }: { muted: boolean }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="party-chat">
      <div
        className="party-chat-header"
        onClick={() => {
          setOpen((o) => !o);
          if (!muted) blipClick();
        }}
      >
        <span className="party-chat-title qx-pixel">⚔️ PARTY</span>
        <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
          {open ? "▾" : "▸"}
        </span>
      </div>
      {open && (
        <>
          <div className="party-chat-body">
            {ACTIVITY_LOG.map((m, i) => (
              <div className="party-msg" key={i}>
                <div className="party-msg-avatar">🧙</div>
                <div>
                  <div className="party-msg-name">
                    <span style={{ color: m.color }}>{m.name}</span>{" "}
                    <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>
                      · {m.time}
                    </span>
                  </div>
                  <div className="party-msg-text">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="party-chat-input-row">
            <input
              className="party-chat-input"
              placeholder="Find a message..."
              disabled
            />
            <button className="party-chat-send" disabled aria-label="Send">
              ➤
            </button>
          </div>
        </>
      )}
    </div>
  );
}
