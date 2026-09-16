import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

export type Profile = {
  id: string;
  name: string;
  level: number;
  xp: number;
  leetcode_username?: string;
  codeforces_username?: string;
};

export const getProfile = cache(async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,full_name,level,xp,leetcode_username,codeforces_username`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 30,
        tags: [`profile-${userId}`],
      },
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const data = rows[0];
        return {
          id: data.id,
          name: data.full_name || "",
          level: data.level || 1,
          xp: data.xp || 0,
          leetcode_username: data.leetcode_username,
          codeforces_username: data.codeforces_username,
        };
      }
    }
  } catch (err) {
    console.error("Error fetching profile via REST:", err);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, level, xp, leetcode_username, codeforces_username")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.full_name || "",
    level: data.level || 1,
    xp: data.xp || 0,
    leetcode_username: data.leetcode_username,
    codeforces_username: data.codeforces_username,
  };
});

export const getCompletedQuestTitles = cache(async function getCompletedQuestTitles(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quest_progress?select=quest_title&user_id=eq.${userId}`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 30,
        tags: [`progress-${userId}`],
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((row: any) => row.quest_title as string);
      }
    }
  } catch (err) {
    console.error("Error fetching completed quest titles via REST:", err);
  }

  // Fallback to client query
  const { data } = await supabase
    .from("quest_progress")
    .select("quest_title")
    .eq("user_id", userId);

  return (data || []).map((row: any) => row.quest_title as string);
});

export type QuestProgressRow = {
  quest_title: string;
  xp_earned: number;
  completed_at: string;
};

export const getQuestProgressRows = cache(async function getQuestProgressRows(
  supabase: SupabaseClient,
  userId: string
): Promise<QuestProgressRow[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quest_progress?select=quest_title,xp_earned,completed_at&user_id=eq.${userId}&order=completed_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 30,
        tags: [`progress-rows-${userId}`],
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data as QuestProgressRow[];
      }
    }
  } catch (err) {
    console.error("Error fetching quest progress rows via REST:", err);
  }

  // Fallback to client query
  const { data } = await supabase
    .from("quest_progress")
    .select("quest_title, xp_earned, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  return (data || []) as QuestProgressRow[];
});

/** XP needed per level, and how far into the current level a total XP value is. */
export const XP_PER_LEVEL = 200;

export function xpProgressPercent(xp: number): number {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

export const getCompletedSystemDesignSlugs = cache(async function getCompletedSystemDesignSlugs(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/system_design_progress?select=chapter_slug&user_id=eq.${userId}`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 15,
        tags: [`sd-progress-${userId}`],
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((row: any) => row.chapter_slug as string);
      }
    }
  } catch (err) {
    console.error("Error fetching completed system design slugs via REST:", err);
  }

  // Fallback to client query
  const { data } = await supabase
    .from("system_design_progress")
    .select("chapter_slug")
    .eq("user_id", userId);

  return (data || []).map((row: any) => row.chapter_slug as string);
});

