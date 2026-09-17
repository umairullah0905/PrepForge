"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
  CalendarPlus,
  Radio,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import { Contest, getGoogleCalendarUrl } from "@/lib/contests";
import { PlatformIcon } from "@/components/PlatformIcons";

interface ContestCalendarProps {
  initialContests?: Contest[];
}

type PlatformFilter = "all" | "codeforces" | "leetcode" | "codechef";

export default function ContestCalendar({ initialContests = [] }: ContestCalendarProps) {
  const [contests, setContests] = useState<Contest[]>(initialContests);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Current browsing month for calendar view
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Selected day on calendar (null means showing all upcoming)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Timezone string
  const [userTimezone, setUserTimezone] = useState<string>("");

  useEffect(() => {
    try {
      setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setUserTimezone("Local Time");
    }
  }, []);

  // Fetch updated contests
  const refreshContests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contests");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contests)) {
          setContests(data.contests);
        }
      }
    } catch (err) {
      console.error("Failed to refresh contests:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter contests by platform
  const filteredContests = useMemo(() => {
    if (selectedPlatform === "all") return contests;
    return contests.filter((c) => c.platform === selectedPlatform);
  }, [contests, selectedPlatform]);

  // Counts by platform
  const counts = useMemo(() => {
    return {
      all: contests.length,
      codeforces: contests.filter((c) => c.platform === "codeforces").length,
      leetcode: contests.filter((c) => c.platform === "leetcode").length,
      codechef: contests.filter((c) => c.platform === "codechef").length,
    };
  }, [contests]);

  // Map contests by date string (YYYY-MM-DD) for instant calendar lookup
  const contestsByDate = useMemo(() => {
    const map = new Map<string, Contest[]>();
    contests.forEach((c) => {
      const start = new Date(c.startTime);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(c);
    });
    return map;
  }, [contests]);

  // Calendar matrix calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  }, [year, month]);

  // Navigate calendar month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Contests to display in the list/feed
  const displayedContests = useMemo(() => {
    let list = filteredContests;
    if (selectedDate) {
      const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      list = list.filter((c) => {
        const d = new Date(c.startTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return key === selectedKey;
      });
    }
    return list;
  }, [filteredContests, selectedDate]);

  // Helper: Format countdown or relative time
  const getTimeBadge = (contest: Contest) => {
    if (contest.status === "LIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-400 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          LIVE NOW
        </span>
      );
    }

    const diffMs = new Date(contest.startTime).getTime() - Date.now();
    if (diffMs <= 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
          Starting Soon
        </span>
      );
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    let text = "";
    if (diffDays > 0) {
      text = `Starts in ${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      text = `Starts in ${diffHours}h ${mins}m`;
    } else {
      const mins = Math.floor(diffMs / (1000 * 60));
      text = `Starts in ${mins}m`;
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 text-xs font-mono text-zinc-300">
        <Clock className="h-3 w-3 text-zinc-400" />
        {text}
      </span>
    );
  };

  // Helper: Format friendly date
  const formatContestDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Platform styling config
  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case "codeforces":
        return {
          name: "Codeforces",
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          dotColor: "bg-blue-400",
        };
      case "leetcode":
        return {
          name: "LeetCode",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          dotColor: "bg-amber-400",
        };
      case "codechef":
        return {
          name: "CodeChef",
          badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          dotColor: "bg-orange-400",
        };
      default:
        return {
          name: platform,
          badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          dotColor: "bg-zinc-400",
        };
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;

  return (
    <section className="mb-14">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs font-mono text-zinc-300 mb-2">
            <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>COMPETITIVE_SCHEDULE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-zinc-300" />
            <span>Contest Calendar</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time schedule for Codeforces, LeetCode, and CodeChef contests.
            {userTimezone && (
              <span className="ml-2 font-mono text-xs text-zinc-400 hidden md:inline">
                • {userTimezone}
              </span>
            )}
          </p>
        </div>

        {/* View Mode Switcher and Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "calendar"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>List ({filteredContests.length})</span>
            </button>
          </div>

          <button
            onClick={refreshContests}
            disabled={loading}
            title="Refresh contest schedule"
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-zinc-200" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs: All, Codeforces, LeetCode, CodeChef */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedPlatform("all")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            selectedPlatform === "all"
              ? "bg-zinc-100 text-zinc-950 shadow-sm"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <span>All Platforms</span>
          <span
            className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
              selectedPlatform === "all" ? "bg-zinc-300 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setSelectedPlatform("codeforces")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            selectedPlatform === "codeforces"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <PlatformIcon platform="codeforces" className="h-4 w-4" />
          <span>Codeforces</span>
          <span className="rounded-full bg-blue-500/20 text-blue-400 px-1.5 py-0.2 font-mono text-[11px]">
            {counts.codeforces}
          </span>
        </button>

        <button
          onClick={() => setSelectedPlatform("leetcode")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            selectedPlatform === "leetcode"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <PlatformIcon platform="leetcode" className="h-4 w-4" />
          <span>LeetCode</span>
          <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 font-mono text-[11px]">
            {counts.leetcode}
          </span>
        </button>

        <button
          onClick={() => setSelectedPlatform("codechef")}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            selectedPlatform === "codechef"
              ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
              : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <PlatformIcon platform="codechef" className="h-4 w-4" />
          <span>CodeChef</span>
          <span className="rounded-full bg-orange-500/20 text-orange-400 px-1.5 py-0.2 font-mono text-[11px]">
            {counts.codechef}
          </span>
        </button>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1"
          >
            <span>Filtered by {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <span className="text-zinc-400 underline ml-1">Clear</span>
          </button>
        )}
      </div>

      {/* Main Container: Split or Full List */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Grid Section (7 columns on large screens) */}
          <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-zinc-100">
                  {monthNames[month]} {year}
                </span>
                <button
                  onClick={jumpToToday}
                  className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300 hover:bg-zinc-750 transition-colors"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs font-semibold text-zinc-400 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[64px] rounded-lg border border-transparent p-1 opacity-20" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const cellDate = new Date(year, month, dayNum);
                const cellKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const cellContests = contestsByDate.get(cellKey) || [];

                // Filter by platform if active
                const matchingContests =
                  selectedPlatform === "all"
                    ? cellContests
                    : cellContests.filter((c) => c.platform === selectedPlatform);

                const isToday =
                  isCurrentMonthToday && today.getDate() === dayNum;

                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === dayNum;

                const hasContests = matchingContests.length > 0;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDate(null);
                      } else {
                        setSelectedDate(cellDate);
                      }
                    }}
                    className={`group relative flex flex-col justify-between min-h-[54px] sm:min-h-[66px] rounded-lg p-1.5 text-left transition-all border ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-950/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : isToday
                        ? "border-zinc-500 bg-zinc-850/70"
                        : hasContests
                        ? "border-zinc-700/80 bg-zinc-950/70 hover:border-zinc-600 hover:bg-zinc-850/50"
                        : "border-zinc-850/50 bg-zinc-950/30 hover:border-zinc-800 hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-semibold ${
                          isSelected
                            ? "text-emerald-400 font-bold"
                            : isToday
                            ? "text-zinc-100 underline decoration-emerald-500 decoration-2 underline-offset-2"
                            : hasContests
                            ? "text-zinc-200"
                            : "text-zinc-400"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {hasContests && (
                        <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-1 rounded">
                          {matchingContests.length}
                        </span>
                      )}
                    </div>

                    {/* Platform Indicator Dots */}
                    {hasContests && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {matchingContests.slice(0, 3).map((c) => {
                          const config = getPlatformConfig(c.platform);
                          return (
                            <span
                              key={c.id}
                              title={`${config.name}: ${c.title}`}
                              className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
                            />
                          );
                        })}
                        {matchingContests.length > 3 && (
                          <span className="text-[9px] text-zinc-400 font-mono">
                            +{matchingContests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Platform Legend */}
            <div className="mt-5 pt-4 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Codeforces
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  LeetCode
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  CodeChef
                </span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400">
                Click a date to filter
              </span>
            </div>
          </div>

          {/* Agenda / Upcoming Contests Sidebar (5 columns on large screens) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                {selectedDate
                  ? `Scheduled on ${selectedDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : "Upcoming Lineup"}
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                {displayedContests.length} {displayedContests.length === 1 ? "Contest" : "Contests"}
              </span>
            </div>

            {displayedContests.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-8 text-center">
                <CalendarIcon className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-300">
                  {selectedDate
                    ? "No contests scheduled on this date."
                    : "No upcoming contests found for this filter."}
                </p>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    <span>View all upcoming contests</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
                {displayedContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} getTimeBadge={getTimeBadge} formatContestDate={formatContestDate} getPlatformConfig={getPlatformConfig} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full List Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedContests.length === 0 ? (
            <div className="col-span-full rounded-xl border border-zinc-800 bg-zinc-950/40 p-12 text-center">
              <CalendarIcon className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-300">No contests found matching criteria.</p>
            </div>
          ) : (
            displayedContests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} getTimeBadge={getTimeBadge} formatContestDate={formatContestDate} getPlatformConfig={getPlatformConfig} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

// Individual Contest Card
function ContestCard({
  contest,
  getTimeBadge,
  formatContestDate,
  getPlatformConfig,
}: {
  contest: Contest;
  getTimeBadge: (c: Contest) => React.ReactNode;
  formatContestDate: (iso: string) => string;
  getPlatformConfig: (p: string) => { name: string; badgeBg: string; dotColor: string };
}) {
  const config = getPlatformConfig(contest.platform);
  const googleCalUrl = getGoogleCalendarUrl(contest);

  return (
    <div className="group rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 transition-all hover:bg-zinc-900 hover:border-zinc-700 shadow-sm flex flex-col justify-between">
      <div>
        {/* Card Header: Platform badge & Status / Countdown */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${config.badgeBg}`}
          >
            <PlatformIcon platform={contest.platform} className="h-3.5 w-3.5" />
            <span>{config.name}</span>
          </span>

          {getTimeBadge(contest)}
        </div>

        {/* Contest Title */}
        <h4 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
          {contest.title}
        </h4>

        {/* Date, Time & Duration */}
        <div className="flex flex-col gap-1 mt-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>{formatContestDate(contest.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span>Duration: {Math.floor(contest.durationMinutes / 60)}h {contest.durationMinutes % 60 ? `${contest.durationMinutes % 60}m` : "00m"}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-800/80">
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors py-1 px-2 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-800/40"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-zinc-400" />
          <span>Add to Cal</span>
        </a>

        <a
          href={contest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <span>Open Contest</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
