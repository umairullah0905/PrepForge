"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type ChatMessage = {
  id: string;
  user_id: string;
  name: string;
  body: string;
  created_at: string;
};

function formatTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function CommunityChat({
  initialMessages,
  currentUserId,
  currentUserName,
}: {
  initialMessages: ChatMessage[];
  currentUserId: string | null;
  currentUserName: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!currentUserId;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("community-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !currentUserId || !currentUserName) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .insert({ user_id: currentUserId, name: currentUserName, body });
    setSending(false);

    if (!error) setDraft("");
  }

  return (
    <div className="community-chat">
      <div className="community-chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="qx-sub" style={{ fontSize: 13, margin: 0 }}>
            No messages yet — be the first to say something.
          </p>
        ) : (
          messages.map((m) => (
            <div className="community-msg" key={m.id}>
              <div className="party-msg-avatar">🧙</div>
              <div style={{ flex: 1 }}>
                <div className="party-msg-name">
                  <span
                    style={{
                      color: m.user_id === currentUserId ? "var(--mint)" : "var(--parchment)",
                    }}
                  >
                    {m.name}
                  </span>{" "}
                  <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>
                    · {formatTime(m.created_at)}
                  </span>
                </div>
                <div className="community-msg-text">{m.body}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {isLoggedIn ? (
        <form className="community-chat-input-row" onSubmit={handleSend}>
          <input
            className="party-chat-input"
            placeholder="Say something to the party..."
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="submit"
            className="party-chat-send"
            disabled={sending || !draft.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </form>
      ) : (
        <div className="community-chat-signin">
          <a href="/login" className="qx-btn qx-btn-sm">
            SIGN IN TO CHAT
          </a>
        </div>
      )}
    </div>
  );
}
