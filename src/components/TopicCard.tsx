"use client";

import Link from "next/link";
import { ArrowRight, Binary, Building2, Network, Code2, Server, Layers } from "lucide-react";

export default function TopicCard({
  href,
  eyebrow = "TRACK",
  title,
  description,
  level = "BEGINNER",
  problemCount = 450,
  icon,
  trackType,
}: {
  href: string;
  bannerSrc?: string;
  eyebrow?: string;
  title: string;
  description: string;
  level?: string;
  problemCount?: number;
  icon?: React.ReactNode;
  trackType?: "dsa" | "companies" | "system-design";
}) {
  // Determine distinct icon and accent style based on type or title
  const lowerTitle = title.toLowerCase();
  const isDsa = trackType === "dsa" || lowerTitle.includes("data structure") || lowerTitle.includes("algorithm");
  const isCompany = trackType === "companies" || lowerTitle.includes("company");
  const isSystemDesign = trackType === "system-design" || lowerTitle.includes("system design") || lowerTitle.includes("architecture");

  const defaultIcon = isDsa ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
      <Binary className="h-5 w-5" />
    </div>
  ) : isCompany ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
      <Building2 className="h-5 w-5" />
    </div>
  ) : isSystemDesign ? (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
      <Network className="h-5 w-5" />
    </div>
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
      <Layers className="h-5 w-5" />
    </div>
  );

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all hover:bg-zinc-900 hover:border-zinc-700 hover:shadow-lg shadow-sm"
    >
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {eyebrow}
          </span>
          <span className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 font-mono text-xs text-zinc-300">
            {level}
          </span>
        </div>

        <div className="flex items-center gap-3.5 mb-3">
          {icon || defaultIcon}
          <h3 className="font-bold text-lg sm:text-xl text-zinc-100 group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-sm font-mono text-zinc-400">
        <span className="text-zinc-300 font-medium">{problemCount} Active Problems</span>
        <span className="flex items-center gap-1.5 text-zinc-300 group-hover:text-white font-sans font-medium transition-colors">
          <span>Explore Track</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
