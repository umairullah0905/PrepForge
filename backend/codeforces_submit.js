const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const path = require('path');
const { getBrowserExecutable } = require('./browser_utils');
puppeteer.use(StealthPlugin());

let cachedBrowser = null;

async function getBrowser() {
  if (cachedBrowser && cachedBrowser.isConnected()) {
    return cachedBrowser;
  }
  const executablePath = getBrowserExecutable();
  const userDataDir = path.join(__dirname, '.cf_browser_profile');
  cachedBrowser = await puppeteer.launch({
    headless: 'new',
    userDataDir,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  return cachedBrowser;
}

function parseCookies(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (_) {}
    }

    // Cookie header string: "name1=val1; name2=val2"
    return trimmed.split(';').map(part => {
      const idx = part.indexOf('=');
      if (idx === -1) return null;
      return {
        name: part.substring(0, idx).trim(),
        value: part.substring(idx + 1).trim(),
        domain: '.codeforces.com',
        path: '/'
      };
    }).filter(Boolean);
  }

  return [];
}

function formatVerdict(verdict, passedTestCount) {
  if (!verdict) return 'In Queue / Testing';
  switch (verdict) {
    case 'OK':
      return 'Accepted';
    case 'WRONG_ANSWER':
      return `Wrong Answer on test ${passedTestCount + 1}`;
    case 'TIME_LIMIT_EXCEEDED':
      return `Time Limit Exceeded on test ${passedTestCount + 1}`;
    case 'MEMORY_LIMIT_EXCEEDED':
      return `Memory Limit Exceeded on test ${passedTestCount + 1}`;
    case 'COMPILATION_ERROR':
      return 'Compilation Error';
    case 'RUNTIME_ERROR':
      return `Runtime Error on test ${passedTestCount + 1}`;
    case 'CHALLENGED':
      return 'Hacked';
    case 'SKIPPED':
      return 'Skipped';
    case 'TESTING':
      return `Testing on test ${passedTestCount + 1}`;
    default:
      return verdict;
  }
}

function detectEffectiveLanguage(code, declaredLang) {
  if (!code) return declaredLang || 'python';
  const trimmed = code.trim();

  // Obvious C / C++ patterns
  if (
    trimmed.includes('#include <') ||
    trimmed.includes('#include<') ||
    trimmed.includes('using namespace std;') ||
    trimmed.includes('ios_base::sync_with_stdio') ||
    /\bint\s+main\s*\(/.test(trimmed)
  ) {
    return 'cpp';
  }

  // Obvious Java patterns
  if (
    /\bpublic\s+class\b/.test(trimmed) ||
    trimmed.includes('public static void main(') ||
    trimmed.includes('import java.util') ||
    trimmed.includes('import java.io')
  ) {
    return 'java';
  }

  // Obvious Python patterns
  if (
    trimmed.includes('import sys') ||
    trimmed.includes('def solve():') ||
    trimmed.includes('if __name__ ==') ||
    (trimmed.includes('def ') && trimmed.includes(':') && !trimmed.includes('{'))
  ) {
    return 'python';
  }

  // Obvious JavaScript / Node patterns
  if (
    trimmed.includes('require(') ||
    trimmed.includes('console.log(') ||
    trimmed.includes('fs.readFileSync') ||
    trimmed.includes('process.stdin')
  ) {
    return 'javascript';
  }

  return declaredLang || 'python';
}

/**
 * Submits user code to Codeforces and polls the official API for execution verdict.
 */
async function submitToCodeforces({
  problemCode,
  contestId,
  problemIndex,
  language,
  code,
  sessionCookies,
  handle
}) {
  // Normalize problemCode (e.g. "1985A")
  let normContest = contestId ? String(contestId).trim() : '';
  let normIndex = problemIndex ? String(problemIndex).trim().toUpperCase() : '';
  let normCode = problemCode ? String(problemCode).trim().toUpperCase() : '';

  if (normCode && (!normContest || !normIndex)) {
    const match = normCode.match(/^(\d+)([A-Z]\d*)$/);
    if (match) {
      normContest = match[1];
      normIndex = match[2];
    }
  } else if (normContest && normIndex) {
    normCode = `${normContest}${normIndex}`.toUpperCase();
  }

  if (!normCode || !code) {
    return { success: false, error: "Problem code and source code are required." };
  }

  const parsedCookies = parseCookies(sessionCookies);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // Set cookies for codeforces.com domain if provided
    if (parsedCookies && parsedCookies.length > 0) {
      for (const c of parsedCookies) {
        await page.setCookie({
          name: c.name,
          value: c.value,
          domain: c.domain || '.codeforces.com',
          path: c.path || '/',
          httpOnly: c.httpOnly ?? true,
          secure: c.secure ?? true
        }).catch(() => {});
      }
    }

    // Navigate to problemset submit page
    const submitUrl = 'https://codeforces.com/problemset/submit';
    await page.goto(submitUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

    // Verify authentication status using presence of Logout link
    const authStatus = await page.evaluate(() => {
      const logoutLink = document.querySelector('a[href*="/logout"], a[href*="logout"]');
      if (!logoutLink) {
        return { isLoggedIn: false, handle: null };
      }

      // Check header for user handle
      const headerLinks = Array.from(
        document.querySelectorAll('#header a[href*="/profile/"], .lang-chooser a[href*="/profile/"]')
      );
      for (const a of headerLinks) {
        const href = a.getAttribute('href') || '';
        const match = href.match(/\/profile\/([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
          const text = a.textContent.trim();
          if (text && !['profile', 'enter', 'login', 'register'].includes(text.toLowerCase())) {
            return { isLoggedIn: true, handle: match[1] };
          }
        }
      }
      return { isLoggedIn: true, handle: null };
    });

    if (!authStatus.isLoggedIn) {
      return {
        success: false,
        needsAuth: true,
        error: "Codeforces session is not authenticated or has expired. Please click 'Connect Codeforces' and sign in."
      };
    }

    const userHandle = handle || authStatus.handle;
    const effectiveLanguage = detectEffectiveLanguage(code, language);

    // Fill problem code, select language, and inject source code into BOTH Ace Editor (#editor) and Textarea (#sourceCodeTextarea)
    const fillResult = await page.evaluate(({ normCode, language, code }) => {
      const problemInput = document.querySelector('input[name="submittedProblemCode"]');
      if (!problemInput) {
        return { ok: false, error: "Submission form input for problem code was not found." };
      }

      problemInput.value = normCode;
      problemInput.dispatchEvent(new Event('change', { bubbles: true }));
      problemInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Select matching compiler
      const select = document.querySelector('select[name="programTypeId"]');
      if (select) {
        const options = Array.from(select.options);
        const l = (language || 'python').toLowerCase();

        let target = null;
        if (l.includes('python')) {
          target = options.find(o => o.text.includes('PyPy 3.10')) ||
                   options.find(o => o.text.includes('PyPy 3')) ||
                   options.find(o => o.text.includes('Python 3'));
        } else if (l.includes('cpp') || l.includes('c++')) {
          target = options.find(o => o.text.includes('GNU G++20')) ||
                   options.find(o => o.text.includes('GNU G++17')) ||
                   options.find(o => o.text.includes('G++'));
        } else if (l.includes('java')) {
          target = options.find(o => o.text.includes('Java 21')) ||
                   options.find(o => o.text.includes('Java 8'));
        } else if (l.includes('javascript') || l.includes('typescript') || l.includes('node')) {
          target = options.find(o => o.text.includes('Node.js')) ||
                   options.find(o => o.text.includes('JavaScript'));
        }

        if (target) {
          select.value = target.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      // CRITICAL: Set Ace Editor directly. The Ace editor element on Codeforces has id="editor"
      if (window.ace) {
        try {
          const aceEditor = window.ace.edit('editor');
          if (aceEditor) {
            aceEditor.setValue(code, -1);
          }
        } catch (_) {}
      }

      // Also set the underlying textarea#sourceCodeTextarea
      const textarea = document.getElementById('sourceCodeTextarea') ||
                       document.querySelector('textarea[name="source"]');
      if (textarea) {
        textarea.value = code;
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return { ok: true };
    }, { normCode, language: effectiveLanguage, code });

    if (!fillResult.ok) {
      return { success: false, error: fillResult.error || "Failed to fill Codeforces submission form." };
    }

    const submissionSubmitTime = Math.floor(Date.now() / 1000);

    // Submit form via the official button #singlePageSubmitButton
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = document.getElementById('singlePageSubmitButton') ||
                    document.querySelector('form.submit-form input[type="submit"]') ||
                    document.querySelector('input[type="submit"].submit');
        if (btn) {
          btn.click();
        } else {
          const form = document.querySelector('form.submit-form') || document.querySelector('form');
          if (form) form.submit();
        }
      })
    ]);

    // Check for inline validation error notices on Codeforces page
    const pageErrors = await page.evaluate(() => {
      const errorSpans = Array.from(
        document.querySelectorAll('.error.for__source, .error.for__submittedProblemCode, .error.for__programTypeId, span.error')
      );
      const msgs = errorSpans.map(s => s.textContent.trim()).filter(Boolean);
      return msgs.length > 0 ? msgs.join('. ') : null;
    });

    if (pageErrors) {
      return { success: false, error: pageErrors };
    }

    // Poll Codeforces official public API for the verdict using userHandle
    if (!userHandle) {
      return {
        success: true,
        isAccepted: false,
        statusMsg: "Solution submitted to Codeforces.",
        problemCode: normCode
      };
    }

    let verdictData = null;
    // Poll up to 18 attempts * 1.5s = ~27 seconds
    for (let attempt = 0; attempt < 18; attempt++) {
      await new Promise(r => setTimeout(r, 1500));

      try {
        const apiUrl = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(userHandle)}&from=1&count=5`;
        const res = await axios.get(apiUrl, { timeout: 6000 });

        if (res.data && res.data.status === 'OK' && Array.isArray(res.data.result)) {
          const subs = res.data.result;
          const match = subs.find(s => {
            const p = s.problem;
            if (!p) return false;
            const sameContest = !normContest || String(p.contestId) === String(normContest);
            const sameIndex = !normIndex || String(p.index).toUpperCase() === String(normIndex).toUpperCase();
            const recent = !s.creationTimeSeconds || s.creationTimeSeconds >= (submissionSubmitTime - 120);
            return sameContest && sameIndex && recent;
          });

          if (match) {
            if (match.verdict && match.verdict !== 'TESTING') {
              verdictData = match;
              break;
            }
          }
        }
      } catch (pollErr) {
        // Continue polling
      }
    }

    if (!verdictData) {
      return {
        success: true,
        submissionId: null,
        isAccepted: false,
        statusMsg: "Submitted to Codeforces. Testing is queued or in progress.",
        userHandle,
        problemCode: normCode
      };
    }

    const isAccepted = verdictData.verdict === 'OK';

    return {
      success: true,
      submissionId: verdictData.id,
      isAccepted,
      verdict: verdictData.verdict,
      statusMsg: formatVerdict(verdictData.verdict, verdictData.passedTestCount || 0),
      passedTestCount: verdictData.passedTestCount ?? 0,
      runtime: verdictData.timeConsumedMillis !== undefined ? `${verdictData.timeConsumedMillis} ms` : null,
      memory: verdictData.memoryConsumedBytes !== undefined ? `${Math.round(verdictData.memoryConsumedBytes / 1024)} KB` : null,
      programmingLanguage: verdictData.programmingLanguage || null,
      userHandle,
      problemCode: normCode
    };

  } catch (err) {
    console.error(`Error submitting ${normCode} to Codeforces:`, err);
    return { success: false, error: err.message };
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = { submitToCodeforces };
