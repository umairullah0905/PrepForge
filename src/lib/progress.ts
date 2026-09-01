import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  name: string;
  level: number;
  xp: number;
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, level, xp")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function getCompletedQuestTitles(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("quest_progress")
    .select("quest_title")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((row) => row.quest_title as string);
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
  const { data, error } = await supabase
    .from("quest_progress")
    .select("quest_title, xp_earned, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });

  if (error || !data) return [];
  return data as QuestProgressRow[];
}

/** XP needed per level, and how far into the current level a total XP value is. */
export const XP_PER_LEVEL = 200;

export function xpProgressPercent(xp: number): number {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}
