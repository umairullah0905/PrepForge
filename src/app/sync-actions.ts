"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { completeQuestAction } from "./quest-actions";
import { getCompletedQuestTitles } from "@/lib/progress";

export async function syncExternalProfilesAction(
  leetcodeUsername?: string,
  codeforcesUsername?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    // 1. Get all available questions from our database
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*");
      
    if (questionsError) throw new Error(questionsError.message);
    if (!questions || questions.length === 0) return { ok: true, message: "No questions to sync." };

    // 2. Get user's already completed quests
    const completedTitles = await getCompletedQuestTitles(supabase, user.id);
    const completedSet = new Set(completedTitles);

    let newlyCompleted = 0;

    // --- CODEFORCES SYNC ---
    if (codeforcesUsername) {
      try {
        const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${codeforcesUsername}`);
        const cfData = await cfRes.json();
        
        if (cfData.status === "OK") {
          const solvedCfProblemIds = new Set<string>();
          for (const sub of cfData.result) {
            if (sub.verdict === "OK" && sub.problem && sub.problem.contestId && sub.problem.index) {
              solvedCfProblemIds.add(`${sub.problem.contestId}${sub.problem.index}`);
            }
          }

          const cfQuestions = questions.filter(q => q.platform === "Codeforces");
          for (const q of cfQuestions) {
            if (solvedCfProblemIds.has(q.platform_id) && !completedSet.has(q.title)) {
              const xp = q.difficulty === 'Easy' ? 100 : q.difficulty === 'Medium' ? 300 : 700;
              const res = await completeQuestAction(q.title, xp);
              if (!res.ok) {
                console.error("Failed to complete quest:", res);
                return { ok: false, error: res.message || res.reason };
              }
              newlyCompleted++;
              completedSet.add(q.title); // prevent double sync in same run
            }
          }
        }
      } catch (err) {
        console.error("Codeforces sync error:", err);
      }
    }

    // --- LEETCODE SYNC ---
    if (leetcodeUsername) {
      try {
        // Fetch recent 50 AC submissions from LeetCode via GraphQL
        const lcRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                  title
                  titleSlug
                }
              }
            `,
            variables: { username: leetcodeUsername, limit: 50 }
          })
        });
        
        const lcData = await lcRes.json();
        const acList = lcData?.data?.recentAcSubmissionList || [];
        const solvedLcSlugs = new Set<string>(acList.map((sub: any) => sub.titleSlug));
        const solvedLcTitles = new Set<string>(acList.map((sub: any) => sub.title));

        const lcQuestions = questions.filter(q => q.platform === "LeetCode");
        for (const q of lcQuestions) {
          // We can match by title or platform_id (which might be the titleSlug)
          if ((solvedLcSlugs.has(q.platform_id) || solvedLcTitles.has(q.title)) && !completedSet.has(q.title)) {
             const xp = q.difficulty === 'Easy' ? 100 : q.difficulty === 'Medium' ? 300 : 700;
             const res = await completeQuestAction(q.title, xp);
             if (!res.ok) {
               console.error("Failed to complete quest:", res);
               return { ok: false, error: res.message || res.reason };
             }
             newlyCompleted++;
             completedSet.add(q.title);
          }
        }
      } catch (err) {
        console.error("LeetCode sync error:", err);
      }
    }

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/quests");
    
    return { ok: true, newlyCompleted };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
