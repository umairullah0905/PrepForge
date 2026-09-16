"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExternalLink,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  List,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Maximize2,
  X,
  Share2,
  Check,
} from "lucide-react";
import type { ChapterDetail, ChapterSummary } from "@/lib/system-design";
import { toggleSystemDesignChapterCompletion } from "@/app/actions";

interface ChapterViewerProps {
  chapter: ChapterDetail;
  prevChapter: ChapterSummary | null;
  nextChapter: ChapterSummary | null;
  initialCompleted?: boolean;
  isLoggedIn?: boolean;
}

export default function ChapterViewer({
  chapter,
  prevChapter,
  nextChapter,
  initialCompleted = false,
  isLoggedIn = false,
}: ChapterViewerProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync completion state with initialCompleted or localStorage
  useEffect(() => {
    if (initialCompleted) {
      setIsCompleted(true);
    } else {
      try {
        const saved = localStorage.getItem(`sd_completed_${chapter.slug}`);
        if (saved === "true") setIsCompleted(true);
      } catch (e) {}
    }
  }, [chapter.slug, initialCompleted]);

  const toggleComplete = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);

    // Save to local storage for offline continuity
    try {
      localStorage.setItem(`sd_completed_${chapter.slug}`, String(nextState));
    } catch (e) {}

    // Sync to Supabase table and award XP if logged in
    if (isLoggedIn) {
      setIsSyncing(true);
      try {
        await toggleSystemDesignChapterCompletion(chapter.slug, nextState);
      } catch (err) {
        console.error("Failed to sync chapter progress to Supabase:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Scroll spy & reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const pct = Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100));
        setScrollProgress(pct);
      }

      // Check which heading is currently in viewport
      const headings = chapter.toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPos = window.scrollY + 120;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = headings[i];
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(el.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapter.toc]);

  // Handle clicking on diagrams inside the content for lightbox
  useEffect(() => {
    const article = document.getElementById("chapter-article-content");
    if (!article) return;

    const handleImgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === "img") {
        const img = target as HTMLImageElement;
        setLightboxImg({ src: img.src, alt: img.alt || "System Architecture Diagram" });
      }
    };

    article.addEventListener("click", handleImgClick);
    return () => article.removeEventListener("click", handleImgClick);
  }, [chapter.contentHtml]);

  const diffClass =
    chapter.difficulty.toLowerCase() === "fundamentals" ||
    chapter.difficulty.toLowerCase() === "interview framework"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : chapter.difficulty.toLowerCase() === "medium"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return (
    <div className="relative">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-emerald-400 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Lightbox Modal for Architecture Diagrams */}
      {lightboxImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-5 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-400 truncate max-w-md">
                {lightboxImg.alt}
              </span>
              <button
                onClick={() => setLightboxImg(null)}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                title="Close Lightbox"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg.src}
              alt={lightboxImg.alt}
              className="max-h-[75vh] w-auto object-contain rounded-lg border border-zinc-900"
            />
            <div className="mt-3 text-[11px] font-mono text-zinc-500 text-center">
              ByteByteGo Architecture Diagram • Click outside or press Esc to close
            </div>
          </div>
        </div>
      )}

      {/* Chapter Header Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs font-medium text-zinc-300">
                Chapter {chapter.chapterNumber}
              </span>
              <span
                className={`inline-flex items-center rounded border px-2.5 py-0.5 font-mono text-xs font-medium ${diffClass}`}
              >
                {chapter.difficulty}
              </span>
              <span className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
                {chapter.scale}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {chapter.readTimeMinutes}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
              {chapter.title}
            </h1>

            {/* Topic Chips */}
            {chapter.topics && chapter.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {chapter.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="rounded bg-zinc-950/80 px-2 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-800/80"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
            <a
              href={chapter.byteByteGoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-950 hover:bg-white transition-colors shadow-sm"
            >
              <span>ByteByteGo Original</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleComplete}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
                title={isCompleted ? "Click to mark as incomplete" : "Mark chapter as completed (+50 XP)"}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {isCompleted
                    ? "Completed"
                    : isSyncing
                    ? "Saving..."
                    : "Mark as Read (+50 XP)"}
                </span>
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                title="Copy Link to Chapter"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Source Reference Callout */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              Curriculum Source:{" "}
              <strong className="text-zinc-200 font-semibold">
                ByteByteGo (Alex Xu)
              </strong>{" "}
              — System Design Interview Course
            </span>
          </div>
          <a
            href={chapter.byteByteGoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-zinc-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
          >
            <span>{chapter.byteByteGoUrl}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Content + Sticky Sidebar TOC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Article Body */}
        <article className="lg:col-span-8 xl:col-span-9 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-10">
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .sd-article-body {
                color: #d4d4d8;
                font-size: 15px;
                line-height: 1.75;
                font-family: var(--font-sans), sans-serif;
              }
              .sd-article-body p {
                margin-bottom: 1.35rem;
              }
              .sd-article-body h1,
              .sd-article-body h2,
              .sd-article-body h3,
              .sd-article-body h4 {
                color: #fafafa;
                font-weight: 700;
                letter-spacing: -0.015em;
                scroll-margin-top: 5.5rem;
              }
              .sd-article-body h1 {
                font-size: 1.75rem;
                margin-top: 2rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #27272a;
              }
              .sd-article-body h2 {
                font-size: 1.35rem;
                margin-top: 2.5rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #27272a;
              }
              .sd-article-body h3 {
                font-size: 1.15rem;
                margin-top: 1.75rem;
                margin-bottom: 0.75rem;
                color: #e4e4e7;
              }
              .sd-article-body h4 {
                font-size: 1rem;
                margin-top: 1.25rem;
                margin-bottom: 0.5rem;
                color: #d4d4d8;
              }
              .sd-article-body strong {
                color: #ffffff;
                font-weight: 600;
              }
              .sd-article-body em {
                color: #e4e4e7;
                font-style: italic;
              }
              .sd-article-body ul {
                list-style-type: disc;
                margin-left: 1.75rem;
                margin-bottom: 1.35rem;
              }
              .sd-article-body ol {
                list-style-type: decimal;
                margin-left: 1.75rem;
                margin-bottom: 1.35rem;
              }
              .sd-article-body li {
                margin-bottom: 0.5rem;
              }
              .sd-article-body code {
                background: #18181b;
                border: 1px solid #27272a;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: var(--font-mono), monospace;
                font-size: 13px;
                color: #e4e4e7;
              }
              .sd-article-body pre {
                background: #121215;
                border: 1px solid #27272a;
                padding: 14px 18px;
                border-radius: 8px;
                font-family: var(--font-mono), monospace;
                font-size: 13px;
                overflow-x: auto;
                color: #f4f4f5;
                margin: 1.5rem 0;
              }
              .sd-article-body blockquote {
                border-left: 3px solid #3b82f6;
                background: #121215;
                padding: 12px 18px;
                border-radius: 0 6px 6px 0;
                color: #a1a1aa;
                margin: 1.5rem 0;
              }
              .sd-article-body table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
                font-size: 14px;
              }
              .sd-article-body th {
                background: #18181b;
                border: 1px solid #27272a;
                padding: 10px 14px;
                text-align: left;
                font-weight: 600;
                color: #f4f4f5;
              }
              .sd-article-body td {
                border: 1px solid #27272a;
                padding: 8px 14px;
                color: #d4d4d8;
              }
              .sd-article-body tr:nth-child(even) td {
                background: #121215/60;
              }
              .sd-article-body figure {
                margin: 2rem 0;
                text-align: center;
              }
              .sd-article-body img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                border: 1px solid #27272a;
                margin: 0 auto;
                display: block;
                cursor: zoom-in;
                transition: transform 0.2s ease, border-color 0.2s ease;
                background: #121215;
              }
              .sd-article-body img:hover {
                border-color: #3b82f6;
              }
              .sd-article-body figcaption {
                margin-top: 0.6rem;
                font-size: 12px;
                font-family: var(--font-mono), monospace;
                color: #a1a1aa;
              }
              .sd-article-body a {
                color: #60a5fa;
                text-decoration: underline;
                text-underline-offset: 3px;
                transition: color 0.15s ease;
              }
              .sd-article-body a:hover {
                color: #93c5fd;
              }
            `,
            }}
          />

          <div
            id="chapter-article-content"
            className="sd-article-body"
            dangerouslySetInnerHTML={{ __html: chapter.contentHtml }}
          />

          {/* Reference Attribution Box at End of Article */}
          <div className="mt-12 pt-8 border-t border-zinc-800">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  Attribution & Rights
                </div>
                <div className="text-sm text-zinc-200 font-medium">
                  Content Reference: ByteByteGo System Design Interview
                </div>
                <p className="text-xs text-zinc-400">
                  Original content and system architecture diagrams are authored by Alex Xu and the ByteByteGo team.
                </p>
              </div>
              <a
                href={chapter.byteByteGoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <span>View on ByteByteGo</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </article>

        {/* Sticky Table of Contents Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 sticky top-24 space-y-5">
          {/* Quick outline card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800/80 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <List className="h-4 w-4 text-zinc-500" />
              <span>Chapter Outline</span>
            </div>

            <nav className="max-h-[60vh] overflow-y-auto space-y-1 pr-1 text-xs">
              {chapter.toc && chapter.toc.length > 0 ? (
                chapter.toc.map((item) => {
                  const isH3 = item.level === 3;
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 transition-colors rounded-md px-2 ${
                        isH3 ? "pl-5 text-zinc-400 hover:text-zinc-200" : "text-zinc-300 hover:text-white font-medium"
                      } ${
                        isActive
                          ? "bg-zinc-800/80 text-emerald-400 font-semibold"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      <span className="line-clamp-1">{item.text}</span>
                    </a>
                  );
                })
              ) : (
                <div className="text-zinc-500 italic py-2">
                  No section outline available
                </div>
              )}
            </nav>
          </div>

          {/* Quick Chapter Navigation Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Curriculum Index
            </div>
            <Link
              href="/system-design"
              className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to all 13 Chapters</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* Bottom Pagination: Previous & Next Chapter */}
      <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prevChapter ? (
          <Link
            href={`/system-design/${prevChapter.slug}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-mono text-zinc-500">
                <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                <span>Previous Chapter {prevChapter.chapterNumber}</span>
              </div>
              <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors line-clamp-1">
                {prevChapter.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-zinc-850/60 bg-zinc-950/40 p-5 text-xs font-mono text-zinc-600">
            First Chapter in Syllabus
          </div>
        )}

        {nextChapter ? (
          <Link
            href={`/system-design/${nextChapter.slug}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors flex items-center justify-between text-right sm:ml-auto w-full"
          >
            <div className="space-y-1 ml-auto">
              <div className="flex items-center justify-end gap-1 text-xs font-mono text-zinc-500">
                <span>Next Chapter {nextChapter.chapterNumber}</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors line-clamp-1">
                {nextChapter.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-zinc-850/60 bg-zinc-950/40 p-5 text-xs font-mono text-zinc-600 text-right">
            Curriculum Complete
          </div>
        )}
      </div>
    </div>
  );
}
