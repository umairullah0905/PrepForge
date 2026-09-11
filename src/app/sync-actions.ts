"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCompletedQuestTitles } from "@/lib/progress";

export async function syncExternalProfilesAction(
  leetcodeUsername?: string,
  codeforcesUsername?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const cleanLcUser = leetcodeUsername?.trim();
  const cleanCfUser = codeforcesUsername?.trim();

  try {
    // 1. Get all available questions from our database
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, title, difficulty, platform, platform_id");

    if (questionsError) throw new Error(questionsError.message);
    if (!questions || questions.length === 0) {
      return { ok: true, newlyCompleted: 0, message: "No questions in database to sync." };
    }

    // 2. Get user's already completed quests
    const completedTitles = await getCompletedQuestTitles(supabase, user.id);
    const completedSet = new Set(completedTitles);

    let newlyCompleted = 0;

    // --- CODEFORCES SYNC ---
    if (cleanCfUser) {
      try {
        const cfRes = await fetch(
          `https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanCfUser)}`,
          { cache: "no-store" }
        );
        const cfData = await cfRes.json();

        if (cfData.status === "OK" && Array.isArray(cfData.result)) {
          const solvedCfProblemIds = new Set<string>();
          for (const sub of cfData.result) {
            if (
              sub.verdict === "OK" &&
              sub.problem &&
              sub.problem.contestId &&
              sub.problem.index
            ) {
              solvedCfProblemIds.add(
                `${sub.problem.contestId}${sub.problem.index}`.toUpperCase()
              );
            }
          }

          const cfQuestions = questions.filter((q) => q.platform === "Codeforces");
          for (const q of cfQuestions) {
            const platformIdUpper = q.platform_id?.toUpperCase();
            if (
              platformIdUpper &&
              solvedCfProblemIds.has(platformIdUpper) &&
              !completedSet.has(q.title)
            ) {
              const xp =
                q.difficulty === "Easy" ? 100 : q.difficulty === "Medium" ? 300 : 700;

              const { data, error } = await supabase.rpc("award_quest_xp", {
                p_quest_title: q.title,
                p_xp: xp,
              });

              if (!error) {
                newlyCompleted++;
                completedSet.add(q.title);
              } else {
                console.error("Error awarding CF quest XP:", error);
              }
            }
          }
        }
      } catch (err) {
        console.error("Codeforces sync error:", err);
      }
    }

    // --- LEETCODE SYNC ---
    if (cleanLcUser) {
      try {
        const lcRes = await fetch("https://leetcode.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
          body: JSON.stringify({
            query: `
              query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                  title
                  titleSlug
                }
              }
            `,
            variables: { username: cleanLcUser, limit: 50 },
          }),
          cache: "no-store",
        });

        const lcData = await lcRes.json();
        const acList = lcData?.data?.recentAcSubmissionList || [];
        const solvedLcSlugs = new Set<string>(
          acList.map((sub: any) => sub.titleSlug?.toLowerCase()).filter(Boolean)
        );
        const solvedLcTitles = new Set<string>(
          acList.map((sub: any) => sub.title?.toLowerCase()).filter(Boolean)
        );

        const lcQuestions = questions.filter((q) => q.platform === "LeetCode");
        for (const q of lcQuestions) {
          const matchSlug =
            q.platform_id && solvedLcSlugs.has(q.platform_id.toLowerCase());
          const matchTitle = q.title && solvedLcTitles.has(q.title.toLowerCase());

          if ((matchSlug || matchTitle) && !completedSet.has(q.title)) {
            const xp =
              q.difficulty === "Easy" ? 100 : q.difficulty === "Medium" ? 300 : 700;

            const { data, error } = await supabase.rpc("award_quest_xp", {
              p_quest_title: q.title,
              p_xp: xp,
            });

            if (!error) {
              newlyCompleted++;
              completedSet.add(q.title);
            } else {
              console.error("Error awarding LC quest XP:", error);
            }
          }
        }
      } catch (err) {
        console.error("LeetCode sync error:", err);
      }
    }

    updateTag(`progress-${user.id}`);
    updateTag(`profile-${user.id}`);
    updateTag(`progress-rows-${user.id}`);
    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/quests");
    revalidatePath("/dsa");

    return { ok: true, newlyCompleted };
  } catch (error: any) {
    console.error("Sync error:", error);
    return { ok: false, error: error.message };
  }
}
