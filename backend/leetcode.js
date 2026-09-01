const axios = require('axios');
const supabase = require('./db');

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';

async function fetchLeetCodeQuestions(limit = 10, topicSlug = "") {
  let filters = {};
  if (topicSlug) {
    filters.tags = [topicSlug];
  }

  // First query to get the list of problems
  const problemListQuery = {
    query: `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            hasVideoSolution
            hasSolution
            topicTags {
              name
              id
              slug
            }
          }
        }
      }
    `,
    variables: {
      categorySlug: "",
      skip: 0,
      limit: limit,
      filters: filters
    }
  };

  try {
    const response = await axios.post(LEETCODE_API_ENDPOINT, problemListQuery);
    const questions = response.data.data.problemsetQuestionList.questions;
    
    for (const q of questions) {
      if (q.paidOnly) continue; // Skip premium questions if we can't get content
      console.log(`Fetching details for: ${q.title}`);
      await fetchAndSaveQuestionDetails(q.titleSlug, q);
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("LeetCode fetching complete!");
    return { success: true, count: questions.length };
  } catch (error) {
    console.error("Error fetching LeetCode questions:", error.message);
    return { success: false, error: error.message };
  }
}

async function fetchAndSaveQuestionDetails(titleSlug, basicInfo) {
  const detailQuery = {
    query: `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          isPaidOnly
          difficulty
          likes
          dislikes
          similarQuestions
          exampleTestcases
          topicTags {
            name
            slug
          }
          hints
        }
      }
    `,
    variables: {
      titleSlug: titleSlug
    }
  };

  try {
    const response = await axios.post(LEETCODE_API_ENDPOINT, detailQuery);
    const questionDetails = response.data.data.question;

    if (!questionDetails || !questionDetails.content) {
      console.log(`No content for ${titleSlug} (maybe premium?)`);
      return;
    }

    const topics = questionDetails.topicTags ? questionDetails.topicTags.map(t => t.name) : [];

    // Save to Supabase
    const { data, error } = await supabase
      .from('questions')
      .upsert({
        platform: 'LeetCode',
        platform_id: titleSlug,
        title: questionDetails.title,
        url: `https://leetcode.com/problems/${titleSlug}/`,
        solution_link: `https://leetcode.com/problems/${titleSlug}/editorial/`,
        description: questionDetails.content, // This is HTML and contains images/constraints
        difficulty: questionDetails.difficulty,
        topics: topics,
        test_cases: questionDetails.exampleTestcases
      }, { onConflict: 'platform,platform_id' });

    if (error) {
      console.error(`Error saving ${titleSlug} to Supabase:`, error.message);
    } else {
      console.log(`Saved ${titleSlug} successfully.`);
    }

  } catch (error) {
    console.error(`Error fetching details for ${titleSlug}:`, error.message);
  }
}

module.exports = { fetchLeetCodeQuestions };
