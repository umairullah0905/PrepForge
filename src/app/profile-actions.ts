"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateProfileUsernames(
  leetcodeUsername: string,
  codeforcesUsername: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      leetcode_username: leetcodeUsername || null,
      codeforces_username: codeforcesUsername || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  return { ok: true };
}
