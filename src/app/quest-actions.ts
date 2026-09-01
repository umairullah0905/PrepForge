"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type CompleteQuestResult =
  | { ok: true; xp: number; level: number; awarded: boolean }
  | { ok: false; reason: "not-authenticated" | "error"; message?: string };

export async function completeQuestAction(
  questTitle: string,
  xp: number
): Promise<CompleteQuestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not-authenticated" };
  }

  const { data, error } = await supabase.rpc("award_quest_xp", {
    p_quest_title: questTitle,
    p_xp: xp,
  });

  if (error) {
    return { ok: false, reason: "error", message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/profile");

  const row = data?.[0];
  return {
    ok: true,
    xp: row?.xp ?? 0,
    level: row?.level ?? 1,
    awarded: row?.awarded ?? false,
  };
}
