import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

export type Profile = {
  id: string;
  name: string;
  level: number;
  xp: number;
  leetcode_username?: string;
  codeforces_username?: string;
  is_premium?: boolean;
};

export const getProfile = cache(async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, level, xp, leetcode_username, codeforces_username, is_premium")
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
    is_premium: Boolean(data.is_premium),
  };
});

export const getCompletedQuestTitles = cache(async function getCompletedQuestTitles(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("quest_progress")
    .select("quest_title")
    .eq("user_id", userId);

  if (error || !data) {
    if (error) console.error("Error fetching quest progress:", error.message);
    return [];
  }

  return data.map((row: any) => row.quest_title as string);
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
  const { data, error } = await supabase
    .from("quest_progress")
    .select("quest_title, xp_earned, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("Error fetching quest progress rows:", error.message);
    return [];
  }

  return data as QuestProgressRow[];
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
  const { data, error } = await supabase
    .from("system_design_progress")
    .select("chapter_slug")
    .eq("user_id", userId);

  if (error || !data) {
    if (error) console.error("Error fetching system design progress:", error.message);
    return [];
  }

  return data.map((row: any) => row.chapter_slug as string);
});
