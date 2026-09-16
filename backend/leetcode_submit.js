const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getBrowserExecutable } = require('./browser_utils');
puppeteer.use(StealthPlugin());

let cachedBrowser = null;

async function getBrowser() {
  if (cachedBrowser && cachedBrowser.isConnected()) {
    return cachedBrowser;
  }
  const executablePath = getBrowserExecutable();
  cachedBrowser = await puppeteer.launch({
    headless: 'new',
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  return cachedBrowser;
}

const LEETCODE_LANG_MAP = {
  python: 'python3',
  python3: 'python3',
  javascript: 'javascript',
  typescript: 'typescript',
  cpp: 'cpp',
  java: 'java'
};

function detectEffectiveLanguage(code, declaredLang) {
  if (!code) return declaredLang || 'python3';
  const trimmed = code.trim();

  // Obvious C++ patterns on LeetCode
  if (
    trimmed.includes('vector<') ||
    trimmed.includes('std::') ||
    trimmed.includes('unordered_map<') ||
    trimmed.includes('unordered_set<') ||
    trimmed.includes('ListNode*') ||
    trimmed.includes('TreeNode*') ||
    (trimmed.includes('class Solution') && trimmed.includes('public:')) ||
    trimmed.includes('#include')
  ) {
    return 'cpp';
  }

  // Obvious Java patterns on LeetCode
  if (
    trimmed.includes('public int') ||
    trimmed.includes('public boolean') ||
    trimmed.includes('public void') ||
    trimmed.includes('public String') ||
    trimmed.includes('public List<') ||
    trimmed.includes('int[]') ||
    trimmed.includes('String[]') ||
    trimmed.includes('HashMap<') ||
    trimmed.includes('System.out')
  ) {
    return 'java';
  }

  // Obvious Python patterns on LeetCode
  if (
    (trimmed.includes('def ') && trimmed.includes('self')) ||
    (trimmed.includes('class Solution:') && !trimmed.includes('{')) ||
    trimmed.includes('elif ') ||
    /def\s+[a-zA-Z0-9_]+\s*\(\s*self/.test(trimmed)
  ) {
    return 'python3';
  }

  // Obvious TypeScript / JavaScript patterns on LeetCode
  if (
    trimmed.includes('function(') ||
    trimmed.includes('function (') ||
    trimmed.includes('console.log(') ||
    (trimmed.includes('var ') && !trimmed.includes('class Solution'))
  ) {
    if (/:\s*(number|string|boolean|void|number\[\])/.test(trimmed)) {
      return 'typescript';
    }
    return 'javascript';
  }

  return declaredLang || 'python3';
}

/**
 * Submits user code to LeetCode and polls for the execution verdict.
 */
async function submitToLeetCode({ slug, language, code, sessionCookie, questionId }) {
  if (!slug || !code) {
    return { success: false, error: "Problem slug and code are required." };
  }

  if (!sessionCookie) {
    return {
      success: false,
      needsAuth: true,
      error: "Missing LEETCODE_SESSION cookie. Please connect your LeetCode account."
    };
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // Set user's session cookie on leetcode.com
    await page.setCookie({
      name: 'LEETCODE_SESSION',
      value: sessionCookie.trim(),
      domain: '.leetcode.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    const problemUrl = `https://leetcode.com/problems/${slug}/`;
    await page.goto(problemUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const effectiveLang = detectEffectiveLanguage(code, language);
    const langSlug = LEETCODE_LANG_MAP[(effectiveLang || language || '').toLowerCase()] || 'python3';

    // Submit the code from inside the authenticated browser context
    const submitResult = await page.evaluate(async (args) => {
      const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
      const csrf = csrfMatch ? csrfMatch[1] : '';

      try {
        const res = await fetch(`https://leetcode.com/problems/${args.slug}/submit/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrftoken': csrf
          },
          body: JSON.stringify({
            question_id: args.questionId || '1',
            lang: args.langSlug,
            typed_code: args.code
          })
        });

        const data = await res.json();
        return { status: res.status, data };
      } catch (err) {
        return { status: 500, error: err.message };
      }
    }, { slug, langSlug, code, questionId });

    if (submitResult.status === 403 || submitResult.data?.error) {
      const errMsg = submitResult.data?.error || "Authentication failed on LeetCode. Please check your LEETCODE_SESSION cookie.";
      return { success: false, error: errMsg, needsAuth: true };
    }

    const submissionId = submitResult.data?.submission_id;
    if (!submissionId) {
      return { success: false, error: "Failed to get submission ID from LeetCode.", raw: submitResult.data };
    }

    // Poll for the submission result (up to 20 seconds)
    let verdict = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise(r => setTimeout(r, 1500));

      const checkResult = await page.evaluate(async (id) => {
        try {
          const res = await fetch(`https://leetcode.com/submissions/detail/${id}/check/`);
          return await res.json();
        } catch (e) {
          return null;
        }
      }, submissionId);

      if (checkResult && checkResult.state === 'SUCCESS') {
        verdict = checkResult;
        break;
      }
    }

    if (!verdict) {
      return { success: false, error: "Submission timed out while waiting for LeetCode judge." };
    }

    const isAccepted = verdict.status_msg === 'Accepted';

    return {
      success: true,
      submissionId,
      isAccepted,
      statusMsg: verdict.status_msg,
      totalCorrect: verdict.total_correct ?? 0,
      totalTestcases: verdict.total_testcases ?? 0,
      runtime: verdict.status_runtime || null,
      runtimePercentile: verdict.runtime_percentile ? `${verdict.runtime_percentile.toFixed(1)}%` : null,
      memory: verdict.status_memory || null,
      memoryPercentile: verdict.memory_percentile ? `${verdict.memory_percentile.toFixed(1)}%` : null,
      compileError: verdict.full_compile_error || null,
      runtimeError: verdict.full_runtime_error || null,
      lastTestcase: verdict.last_testcase || null,
      expectedOutput: verdict.expected_output || null,
      codeOutput: verdict.code_output || null,
    };
  } catch (err) {
    console.error(`Error submitting ${slug} to LeetCode:`, err);
    return { success: false, error: err.message };
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = { submitToLeetCode };
