"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function toggleSystemDesignChapterCompletion(slug: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const CHAPTER_XP = 50;

  try {
    if (completed) {
      // Check if already completed
      const { data: existing } = await supabase
        .from("system_design_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("chapter_slug", slug)
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await supabase
          .from("system_design_progress")
          .insert({
            user_id: user.id,
            chapter_slug: slug,
            xp_earned: CHAPTER_XP,
            completed_at: new Date().toISOString(),
          });

        if (insertErr) {
          console.error("Error inserting SD progress:", insertErr);
          return { ok: false, error: insertErr.message };
        }

        // Award XP to profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp, level")
          .eq("id", user.id)
          .single();

        if (profile) {
          const currentXp = profile.xp || 0;
          const newXp = currentXp + CHAPTER_XP;
          const newLevel = Math.floor(newXp / 200) + 1;
          await supabase
            .from("profiles")
            .update({ xp: newXp, level: newLevel })
            .eq("id", user.id);
        }
      }
    } else {
      // Remove from system_design_progress
      const { error: delErr } = await supabase
        .from("system_design_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("chapter_slug", slug);

      if (delErr) {
        console.error("Error deleting SD progress:", delErr);
        return { ok: false, error: delErr.message };
      }

      // Deduct XP from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .single();

      if (profile && (profile.xp || 0) >= CHAPTER_XP) {
        const currentXp = profile.xp || 0;
        const newXp = Math.max(0, currentXp - CHAPTER_XP);
        const newLevel = Math.max(1, Math.floor(newXp / 200) + 1);
        await supabase
          .from("profiles")
          .update({ xp: newXp, level: newLevel })
          .eq("id", user.id);
      }
    }

    revalidatePath("/system-design");
    revalidatePath(`/system-design/${slug}`);
    revalidatePath("/");
    revalidatePath("/profile");

    return { ok: true, completed };
  } catch (err: any) {
    console.error("Exception in toggleSystemDesignChapterCompletion:", err);
    return { ok: false, error: err.message || "Unknown error" };
  }
}

