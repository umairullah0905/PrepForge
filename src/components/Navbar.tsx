"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, User, LogOut, CheckCircle2, Search } from "lucide-react";
import { xpProgressPercent, type Profile } from "@/lib/progress";

export default function Navbar({
  userEmail,
  profile,
  completedCount = 0,
  signOutAction,
}: {
  userEmail?: string | null;
  profile?: Profile | null;
  completedCount?: number;
  signOutAction?: () => void;
}) {
  const pathname = usePathname();
  const isLoggedIn = !!userEmail;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpPct = xpProgressPercent(xp);

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Problems", href: "/dsa" },
    { name: "Companies", href: "/dsa?tab=companies" },
    { name: "System Design", href: "/system-design" },
    { name: "Discussions", href: "/forums" },
    { name: "Community", href: "/community" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 group-hover:border-zinc-700 transition-colors shadow-sm">
              <Terminal className="h-4.5 w-4.5 text-zinc-200" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-100">
                PREPFORGE
              </span>
              <span className="hidden sm:inline-flex items-center rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[11px] font-mono text-zinc-400">
                OS
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 text-zinc-100 border border-zinc-800/90 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status / user */}
        <div className="flex items-center gap-4">
          {/* Quick Search Shortcut */}
          <Link
            href="/dsa"
            className="hidden lg:flex items-center gap-2.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search problems...</span>
            <kbd className="pointer-events-none rounded border border-zinc-700/60 bg-zinc-850 px-1.5 py-0.5 text-xs font-mono text-zinc-400">
              ⌘K
            </kbd>
          </Link>

          {isLoggedIn && profile ? (
            <div className="flex items-center gap-3">
              {/* Subtle Developer Metric pill */}
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-3 rounded-md border border-zinc-800/90 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 transition-colors"
                title={`Level ${level} (${xp} XP total)`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-200 text-xs">
                    L{level}
                  </span>
                  <div className="h-1.5 w-14 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-200 rounded-full"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedCount} solved
                </span>
              </Link>

              {/* Profile Link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
              >
                <User className="h-4 w-4 text-zinc-400" />
                <span className="max-w-[140px] truncate hidden md:inline">
                  {profile.name || userEmail}
                </span>
              </Link>

              {/* Sign out */}
              {signOutAction && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-md px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-200 bg-zinc-100 px-3.5 py-1.5 text-sm font-medium text-zinc-950 hover:bg-white transition-colors shadow-sm"
              >
                Start Practice
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
