import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";
import { getAllChapters } from "@/lib/system-design";
import ChapterListClient from "@/components/system-design/ChapterListClient";
import { BookOpen, ExternalLink, Sparkles, Layers, Cpu, Server } from "lucide-react";

export const revalidate = 60;

export default async function SystemDesignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];

  const chapters = getAllChapters();

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
          {/* Breadcrumb Header */}
          <div className="pb-6 mb-8 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-sm font-mono text-zinc-500 mb-2">
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                Overview
              </Link>
              <span>/</span>
              <span className="text-zinc-300">System Architecture</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
                  System Design Curriculum
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-3xl leading-relaxed">
                  Master distributed systems, capacity planning, and trade-off analysis.
                  Comprehensive case studies and specifications curated from{" "}
                  <strong className="text-zinc-200 font-semibold">ByteByteGo</strong> by Alex Xu.
                </p>
              </div>

              <a
                href="https://bytebytego.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors shrink-0"
              >
                <span>Visit ByteByteGo</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5">
                <div className="text-xs font-mono text-zinc-500">Curriculum</div>
                <div className="text-lg font-bold text-zinc-200 mt-0.5">13 Chapters</div>
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5">
                <div className="text-xs font-mono text-zinc-500">Content Scope</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">50,000+ Words</div>
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5">
                <div className="text-xs font-mono text-zinc-500">Visual Diagrams</div>
                <div className="text-lg font-bold text-blue-400 mt-0.5">Interactive Lightbox</div>
              </div>
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5">
                <div className="text-xs font-mono text-zinc-500">Reference Source</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">Alex Xu / ByteByteGo</div>
              </div>
            </div>
          </div>

          {/* Reference Attribution Banner */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-zinc-200">
                  ByteByteGo System Design Interview Course Reference
                </div>
                <div className="text-zinc-400 text-xs mt-0.5">
                  All architecture specifications, flowcharts, and trade-off matrices are attributed to Alex Xu & ByteByteGo. Direct links are provided on every chapter.
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400 font-medium whitespace-nowrap">
              13 CHAPTERS SYNCED
            </span>
          </div>

          {/* Interactive Chapter Grid */}
          <ChapterListClient chapters={chapters} />
        </div>
      </main>
    </div>
  );
}
