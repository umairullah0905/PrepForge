export interface Contest {
  id: string;
  title: string;
  platform: "codeforces" | "leetcode" | "codechef";
  url: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationMinutes: number;
  status: "UPCOMING" | "LIVE";
}

// Fetch with timeout utility
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Fetch Codeforces contests
export async function fetchCodeforcesContests(): Promise<Contest[]> {
  try {
    const res = await fetchWithTimeout("https://codeforces.com/api/contest.list?gym=false", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "OK" || !Array.isArray(data.result)) return [];

    const nowSec = Math.floor(Date.now() / 1000);
    return data.result
      .filter((c: any) => c.phase === "BEFORE" || c.phase === "CODING")
      .map((c: any) => {
        const start = new Date(c.startTimeSeconds * 1000);
        const end = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
        return {
          id: `cf-${c.id}`,
          title: c.name,
          platform: "codeforces" as const,
          url: `https://codeforces.com/contest/${c.id}`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: Math.round(c.durationSeconds / 60),
          status: c.phase === "CODING" ? ("LIVE" as const) : ("UPCOMING" as const),
        };
      });
  } catch (error) {
    console.warn("Failed to fetch Codeforces contests:", error);
    return [];
  }
}

// Fetch LeetCode contests
export async function fetchLeetCodeContests(): Promise<Contest[]> {
  try {
    const res = await fetchWithTimeout("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        query: "{ allContests { title titleSlug startTime duration originStartTime isVirtual } }",
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const contests = data?.data?.allContests;
    if (!Array.isArray(contests)) return [];

    const nowSec = Math.floor(Date.now() / 1000);
    return contests
      .filter((c: any) => !c.isVirtual && c.startTime + c.duration > nowSec)
      .map((c: any) => {
        const start = new Date(c.startTime * 1000);
        const end = new Date((c.startTime + c.duration) * 1000);
        const isLive = c.startTime <= nowSec && c.startTime + c.duration > nowSec;
        return {
          id: `lc-${c.titleSlug}`,
          title: c.title,
          platform: "leetcode" as const,
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: Math.round(c.duration / 60),
          status: isLive ? ("LIVE" as const) : ("UPCOMING" as const),
        };
      });
  } catch (error) {
    console.warn("Failed to fetch LeetCode contests:", error);
    return [];
  }
}

// Fetch CodeChef contests
export async function fetchCodeChefContests(): Promise<Contest[]> {
  try {
    const res = await fetchWithTimeout(
      "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const future = Array.isArray(data?.future_contests) ? data.future_contests : [];
    const present = Array.isArray(data?.present_contests) ? data.present_contests : [];

    const allCC = [
      ...present.map((c: any) => ({ ...c, _status: "LIVE" as const })),
      ...future.map((c: any) => ({ ...c, _status: "UPCOMING" as const })),
    ];

    return allCC.map((c: any) => {
      const start = new Date(c.contest_start_date_iso || c.contest_start_date);
      const end = new Date(c.contest_end_date_iso || c.contest_end_date);
      const dur =
        parseInt(c.contest_duration, 10) ||
        Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
      return {
        id: `cc-${c.contest_code}`,
        title: c.contest_name,
        platform: "codechef" as const,
        url: `https://www.codechef.com/${c.contest_code}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: dur,
        status: c._status,
      };
    });
  } catch (error) {
    console.warn("Failed to fetch CodeChef contests:", error);
    return [];
  }
}

// Aggregate and sort all upcoming & live contests
export async function getUpcomingContests(): Promise<Contest[]> {
  const [cfRes, lcRes, ccRes] = await Promise.allSettled([
    fetchCodeforcesContests(),
    fetchLeetCodeContests(),
    fetchCodeChefContests(),
  ]);

  const cf = cfRes.status === "fulfilled" ? cfRes.value : [];
  const lc = lcRes.status === "fulfilled" ? lcRes.value : [];
  const cc = ccRes.status === "fulfilled" ? ccRes.value : [];

  const combined = [...cf, ...lc, ...cc];

  // If all failed or empty (e.g. offline dev), provide realistic fallback
  if (combined.length === 0) {
    return getFallbackContests();
  }

  // Sort: LIVE contests first, then ascending by startTime
  return combined.sort((a, b) => {
    if (a.status === "LIVE" && b.status !== "LIVE") return -1;
    if (b.status === "LIVE" && a.status !== "LIVE") return 1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

// Fallback contests when completely offline
function getFallbackContests(): Contest[] {
  const now = Date.now();
  return [
    {
      id: "cf-sample-1",
      title: "Codeforces Round (Div. 2)",
      platform: "codeforces",
      url: "https://codeforces.com/contests",
      startTime: new Date(now + 86400000).toISOString(),
      endTime: new Date(now + 86400000 + 7200000).toISOString(),
      durationMinutes: 120,
      status: "UPCOMING",
    },
    {
      id: "lc-sample-1",
      title: "Weekly Contest 450",
      platform: "leetcode",
      url: "https://leetcode.com/contest",
      startTime: new Date(now + 172800000).toISOString(),
      endTime: new Date(now + 172800000 + 5400000).toISOString(),
      durationMinutes: 90,
      status: "UPCOMING",
    },
    {
      id: "cc-sample-1",
      title: "Starters Contest",
      platform: "codechef",
      url: "https://www.codechef.com",
      startTime: new Date(now + 259200000).toISOString(),
      endTime: new Date(now + 259200000 + 7200000).toISOString(),
      durationMinutes: 120,
      status: "UPCOMING",
    },
  ];
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(contest: Contest): string {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const start = formatTime(contest.startTime);
  const end = formatTime(contest.endTime);
  const title = encodeURIComponent(`[${contest.platform.toUpperCase()}] ${contest.title}`);
  const details = encodeURIComponent(
    `Contest Link: ${contest.url}\nPlatform: ${contest.platform.toUpperCase()}\nDuration: ${contest.durationMinutes} minutes\n\nSynced via PrepForge OS`
  );
  const location = encodeURIComponent(contest.url);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}
