"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Send, User } from "lucide-react";

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
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-zinc-300">#general-discussion</span>
        </div>
        <span className="font-mono text-zinc-500 text-[11px]">
          {messages.length} messages
        </span>
      </div>

      {/* Message List */}
      <div
        className="p-4 flex flex-col gap-4 h-[55vh] min-h-[320px] overflow-y-auto"
        ref={listRef}
      >
        {messages.length === 0 ? (
          <div className="m-auto text-center text-xs font-mono text-zinc-500">
            No messages logged yet. Start the conversation.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === currentUserId;
            return (
              <div className="flex items-start gap-3 text-xs" key={m.id}>
                <div className="h-7 w-7 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-mono font-bold text-zinc-300 shrink-0 text-[11px]">
                  {m.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`font-semibold ${
                        isMe ? "text-zinc-100" : "text-zinc-300"
                      }`}
                    >
                      {m.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                  <div className="text-zinc-300 leading-relaxed break-words">
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      {isLoggedIn ? (
        <form
          className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-2"
          onSubmit={handleSend}
        >
          <input
            className="flex-1 h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
            placeholder="Type a message..."
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="submit"
            className="h-9 w-9 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white disabled:opacity-50 transition-colors shrink-0"
            disabled={sending || !draft.trim()}
            title="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 text-center text-xs text-zinc-400">
          <span>Sign in to participate in technical community channels. </span>
          <Link
            href="/login"
            className="font-medium text-zinc-100 hover:underline ml-1"
          >
            Sign In &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
