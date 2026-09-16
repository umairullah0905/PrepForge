const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const { execFile } = require('child_process');
const { getBrowserExecutable } = require('./browser_utils');
puppeteer.use(StealthPlugin());

/**
 * Checks if a given LEETCODE_SESSION cookie is actually valid and active on LeetCode.
 */
async function verifyLeetCodeCookie(cookieValue) {
  if (!cookieValue || cookieValue.trim().length < 20) return false;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `LEETCODE_SESSION=${cookieValue.trim()}`
      },
      body: JSON.stringify({ query: '{ userStatus { isSignedIn username } }' }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      return !!data?.data?.userStatus?.isSignedIn;
    }
  } catch (_) {}
  return false;
}

/**
 * Attempts to extract LEETCODE_SESSION directly from local Firefox profile SQLite database.
 */
function tryExtractFromFirefox() {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'extract_firefox.py');
    execFile('python', [scriptPath], { timeout: 4000 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve(null);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed && parsed.success && parsed.sessionCookie) {
          return resolve(parsed.sessionCookie);
        }
      } catch (_) {}
      resolve(null);
    });
  });
}

/**
 * Captures LEETCODE_SESSION cookie:
 * 1. Checks local Firefox profile first (only if cookie is currently active and verified).
 * 2. If not found or expired, opens a headful browser window and waits for actual user sign-in.
 */
async function captureLeetCodeSession(timeoutMs = 180000) {
  // 1. Check if Firefox has an ACTIVE (unexpired) session
  const firefoxCookie = await tryExtractFromFirefox();
  if (firefoxCookie) {
    const isValid = await verifyLeetCodeCookie(firefoxCookie);
    if (isValid) {
      return {
        success: true,
        sessionCookie: firefoxCookie,
        source: 'firefox'
      };
    }
  }

  // 2. Launch headful browser window for user to sign in
  const userDataDir = path.join(__dirname, '.browser_profile');
  const executablePath = getBrowserExecutable();

  const launchOptions = {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=620,820',
      '--app=https://leetcode.com/accounts/login/'
    ]
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      ...launchOptions,
      userDataDir
    });
  } catch (launchErr) {
    browser = await puppeteer.launch(launchOptions);
  }

  // Check if existing cookie in .browser_profile is already stale; if so, clear it
  try {
    const pages = await browser.pages();
    if (pages.length > 0) {
      const client = await pages[0].target().createCDPSession();
      const { cookies } = await client.send('Network.getAllCookies');
      const oldSession = cookies.find(c => c.name === 'LEETCODE_SESSION');
      if (oldSession && oldSession.value) {
        const isOldValid = await verifyLeetCodeCookie(oldSession.value);
        if (!isOldValid) {
          // Stale session detected — delete it so the window does NOT close immediately
          await client.send('Network.deleteCookies', {
            name: 'LEETCODE_SESSION',
            domain: '.leetcode.com'
          });
          await client.send('Network.deleteCookies', {
            name: 'LEETCODE_SESSION',
            domain: 'leetcode.com'
          });
        }
      }
    }
  } catch (_) {}

  const startTime = Date.now();

  try {
    while (Date.now() - startTime < timeoutMs) {
      if (!browser.isConnected()) {
        return { success: false, error: "Login window was closed." };
      }

      const pages = await browser.pages();
      if (pages.length === 0) {
        return { success: false, error: "Login window was closed." };
      }

      // Check each page to see if user has successfully logged in
      for (const page of pages) {
        try {
          // Verify actual logged-in status on LeetCode:
          // A user is logged in ONLY if LeetCode reports isSignedIn === true or profile avatar is present
          const authStatus = await page.evaluate(async () => {
            const path = window.location.pathname;
            // If still actively on the login or accounts page, user has not finished signing in
            if (path.includes('/accounts/') || path.includes('/login')) {
              const submitBtn = document.querySelector('button[type="submit"], #signin_btn');
              if (submitBtn) {
                return { isSignedIn: false };
              }
            }

            try {
              const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '{ userStatus { isSignedIn username } }' })
              });
              if (res.ok) {
                const data = await res.json();
                if (data?.data?.userStatus?.isSignedIn) {
                  return {
                    isSignedIn: true,
                    username: data.data.userStatus.username
                  };
                }
              }
            } catch (_) {}

            // Fallback: avatar check in navigation bar
            const avatar = document.querySelector('#navbar_user_avatar, [data-cypress="UserAvatar"]');
            if (avatar) {
              return { isSignedIn: true };
            }

            return { isSignedIn: false };
          });

          if (authStatus && authStatus.isSignedIn) {
            // User is legitimately signed in! Extract the active session cookie
            await new Promise(r => setTimeout(r, 1200));

            let cookies = [];
            try {
              const client = await page.target().createCDPSession();
              const cdpRes = await client.send('Network.getAllCookies');
              cookies = cdpRes.cookies || [];
            } catch (_) {
              cookies = await page.cookies();
            }

            const session = cookies.find(
              c => (c.name === 'LEETCODE_SESSION') && c.value && c.value.length > 20
            );

            if (session) {
              await browser.close().catch(() => {});
              return {
                success: true,
                sessionCookie: session.value,
                username: authStatus.username || null,
                source: 'browser_window'
              };
            }
          }
        } catch (_) {}
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close().catch(() => {});
    return { success: false, error: "Login timed out. Please try again." };
  } catch (err) {
    await browser.close().catch(() => {});
    return { success: false, error: err.message };
  }
}

module.exports = { captureLeetCodeSession, tryExtractFromFirefox, verifyLeetCodeCookie };
