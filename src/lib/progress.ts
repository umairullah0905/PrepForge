import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  name: string;
  level: number;
  xp: number;
  leetcode_username?: string;
  codeforces_username?: string;
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
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
    codeforces_username: data.codeforces_username
  };
}

export async function getCompletedQuestTitles(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quest_progress?select=quest_title&user_id=eq.${userId}`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`
    },
    cache: "no-store"
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((row: any) => row.quest_title as string);
}

export type QuestProgressRow = {
  quest_title: string;
  xp_earned: number;
  completed_at: string;
};

export async function getQuestProgressRows(
  supabase: SupabaseClient,
  userId: string
): Promise<QuestProgressRow[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quest_progress?select=quest_title,xp_earned,completed_at&user_id=eq.${userId}&order=completed_at.desc`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`
    },
    cache: "no-store"
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  return data as QuestProgressRow[];
}

/** XP needed per level, and how far into the current level a total XP value is. */
export const XP_PER_LEVEL = 200;

export function xpProgressPercent(xp: number): number {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}
