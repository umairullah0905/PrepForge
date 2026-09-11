import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";
import { MessageSquare, Plus, Search, Filter, ThumbsUp } from "lucide-react";

export const revalidate = 0;

export default async function ForumsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const threads = [
    {
      topic: "Dynamic Programming",
      title: "How to develop intuition for state transitions in 2D memoization problems?",
      author: "alex_dev",
      replies: 24,
      upvotes: 42,
      time: "2 hours ago",
    },
    {
      topic: "System Design",
      title: "Distributed consensus comparison: Raft vs Paxos in production databases",
      author: "k8s_architect",
      replies: 15,
      upvotes: 38,
      time: "5 hours ago",
    },
    {
      topic: "Graphs",
      title: "Dijkstra vs Bellman-Ford: When negative cycles actually matter in interview questions",
      author: "pathfinder",
      replies: 89,
      upvotes: 112,
      time: "1 day ago",
    },
    {
      topic: "Two Pointers",
      title: "Optimal pointer traversal strategy for Trapping Rain Water with O(1) space",
      author: "matrix_coder",
      replies: 19,
      upvotes: 27,
      time: "2 days ago",
    },
  ];

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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-6 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2 text-sm font-mono text-zinc-500 mb-1.5">
                <Link href="/" className="hover:text-zinc-300 transition-colors">
                  Overview
                </Link>
                <span>/</span>
                <span className="text-zinc-300">Technical Discussions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Discussions &amp; Solutions
              </h1>
              <p className="text-sm text-zinc-400 mt-1.5">
                Peer-reviewed solutions, algorithm intuition, and interview post-mortems.
              </p>
            </div>

            <button
              disabled
              className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 opacity-60 cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>New Thread</span>
            </button>
          </div>

          {/* Threads List (GitHub Discussions Style) */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-sm text-zinc-400 font-mono">
              <span>Pinned Discussions &amp; Popular Threads</span>
              <span>{threads.length} active threads</span>
            </div>

            <div className="divide-y divide-zinc-850">
              {threads.map((t) => (
                <div
                  key={t.title}
                  className="p-4 sm:p-5 hover:bg-zinc-900/80 transition-colors flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 h-8 w-8 rounded-md bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="rounded bg-zinc-950 px-2.5 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-800">
                          {t.topic}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          by {t.author} • {t.time}
                        </span>
                      </div>

                      <h3 className="text-base font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {t.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-sm font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-zinc-500" />
                      <span>{t.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md bg-zinc-950 px-2.5 py-1 border border-zinc-800">
                      <span>{t.replies}</span>
                      <span className="text-zinc-500">replies</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
