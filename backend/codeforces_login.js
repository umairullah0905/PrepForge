const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const { execFile } = require('child_process');
const { getBrowserExecutable } = require('./browser_utils');
puppeteer.use(StealthPlugin());

/**
 * Attempts to extract Codeforces cookies directly from local Firefox profile.
 */
function tryExtractFromFirefox(platform = 'codeforces') {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'extract_firefox.py');
    execFile('python', [scriptPath, platform], { timeout: 4000 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve(null);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed && parsed.success) {
          return resolve(parsed);
        }
      } catch (_) {}
      resolve(null);
    });
  });
}

/**
 * Captures Codeforces session cookies and handle by opening a secure login window:
 * 1. Checks Firefox profile first (zero-click instant detection).
 * 2. If not found, launches headful browser at https://codeforces.com/enter
 * 3. Waits for user to log in and captures session cookies and user handle
 */
async function captureCodeforcesSession(timeoutMs = 180000) {
  // 1. Check if Firefox already has an active Codeforces session
  const firefoxResult = await tryExtractFromFirefox('codeforces');
  if (firefoxResult && firefoxResult.sessionCookies) {
    return {
      success: true,
      sessionCookies: firefoxResult.sessionCookies,
      handle: firefoxResult.handle || 'codeforces_user',
      source: 'firefox'
    };
  }

  const userDataDir = path.join(__dirname, '.cf_browser_profile');
  const executablePath = getBrowserExecutable();

  const launchOptions = {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=720,850',
      '--app=https://codeforces.com/enter'
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

      for (const page of pages) {
        try {
          // Check if user is actually authenticated on Codeforces:
          // A logged-out user NEVER has an 'a[href*="/logout"]' link.
          // When logged in, Codeforces displays 'Logout' and the username link in #header / .lang-chooser.
          const authState = await page.evaluate(() => {
            const logoutLink = document.querySelector('a[href*="/logout"], a[href*="logout"]');
            if (!logoutLink) {
              return { isLoggedIn: false, handle: null };
            }

            // Find the user's handle from the header bar right next to Logout
            const headerLinks = Array.from(
              document.querySelectorAll('#header a[href*="/profile/"], .lang-chooser a[href*="/profile/"]')
            );

            for (const a of headerLinks) {
              const href = a.getAttribute('href') || '';
              const match = href.match(/\/profile\/([a-zA-Z0-9_\-]+)/);
              if (match && match[1]) {
                const text = a.textContent.trim();
                // Ensure it's not a generic word
                if (text && !['profile', 'enter', 'login', 'register'].includes(text.toLowerCase())) {
                  return { isLoggedIn: true, handle: match[1] };
                }
              }
            }

            return { isLoggedIn: true, handle: null };
          });

          if (authState && authState.isLoggedIn) {
            // Give browser a moment to ensure all session cookies are flushed
            await new Promise((r) => setTimeout(r, 1200));

            // Extract all cookies via CDP to capture HttpOnly session cookies
            let cookies = [];
            try {
              const client = await page.target().createCDPSession();
              const cdpRes = await client.send('Network.getAllCookies');
              cookies = cdpRes.cookies || [];
            } catch (_) {
              cookies = await page.cookies();
            }

            // Filter cookies relevant to codeforces.com
            const cfCookies = cookies.filter(
              (c) => c.domain && c.domain.includes('codeforces.com')
            );

            // Also double-check handle if not extracted
            let finalHandle = authState.handle;
            if (!finalHandle) {
              for (const c of cfCookies) {
                if (c.name === 'X-User' && c.value) {
                  finalHandle = decodeURIComponent(c.value);
                  break;
                }
              }
            }

            await browser.close().catch(() => {});
            return {
              success: true,
              handle: finalHandle || 'codeforces_user',
              sessionCookies: JSON.stringify(cfCookies)
            };
          }
        } catch (_) {}
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    await browser.close().catch(() => {});
    return { success: false, error: "Login timed out. Please try again." };
  } catch (err) {
    await browser.close().catch(() => {});
    return { success: false, error: err.message };
  }
}

module.exports = { captureCodeforcesSession };
