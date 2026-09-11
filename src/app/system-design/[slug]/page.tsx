import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import { getProfile, getCompletedQuestTitles } from "@/lib/progress";
import { signOutAction } from "@/app/actions";
import { getChapterBySlug, getAdjacentChapters } from "@/lib/system-design";
import ChapterViewer from "@/components/system-design/ChapterViewer";
import { ArrowLeft, BookOpen, FileCode2 } from "lucide-react";

export const revalidate = 60;

export default async function ChapterDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const completedTitles = user ? await getCompletedQuestTitles(supabase, user.id) : [];
  const { prev, next } = getAdjacentChapters(slug);

  return (
    <div className="qx-root flex flex-col min-h-screen">
      <Navbar
        userEmail={user?.email ?? null}
        profile={profile}
        completedCount={completedTitles.length}
        signOutAction={signOutAction}
      />

      <main className="flex-1 pb-20">
        <div className="qx-container pt-6">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-sm font-mono">
            <div className="flex items-center gap-2 text-zinc-500">
              <Link
                href="/system-design"
                className="hover:text-zinc-300 transition-colors"
              >
                System Design
              </Link>
              <span>/</span>
              <span className="text-zinc-400">Chapter {chapter.chapterNumber}</span>
              <span>/</span>
              <span className="text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                {chapter.title}
              </span>
            </div>

            <Link
              href="/system-design"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Syllabus</span>
            </Link>
          </div>

          {/* Interactive Chapter Viewer */}
          <ChapterViewer
            chapter={chapter}
            prevChapter={prev}
            nextChapter={next}
          />
        </div>
      </main>
    </div>
  );
}
