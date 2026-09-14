const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const { execFile } = require('child_process');
const { getBrowserExecutable } = require('./browser_utils');
puppeteer.use(StealthPlugin());

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
 * 1. Checks local Firefox profile first (instant 0.1s zero-click detection).
 * 2. If not found in Firefox, opens a headful browser window and monitors all tabs/popups.
 */
async function captureLeetCodeSession(timeoutMs = 120000) {
  // 1. First check if Firefox already has an active session
  const firefoxCookie = await tryExtractFromFirefox();
  if (firefoxCookie) {
    return {
      success: true,
      sessionCookie: firefoxCookie,
      source: 'firefox'
    };
  }

  // 2. Otherwise launch browser login window
  const userDataDir = path.join(__dirname, '.browser_profile');
  const executablePath = getBrowserExecutable();

  const launchOptions = {
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=560,740',
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

      // Check cookies across all pages and CDP session (supports Google/GitHub OAuth popup tabs)
      for (const page of pages) {
        try {
          const client = await page.target().createCDPSession();
          const { cookies } = await client.send('Network.getAllCookies');
          const session = cookies.find(
            c => (c.name === 'LEETCODE_SESSION') && c.value && c.value.length > 20
          );
          if (session) {
            await browser.close().catch(() => {});
            return {
              success: true,
              sessionCookie: session.value,
              source: 'browser_window'
            };
          }
        } catch (_) {}

        try {
          const pageCookies = await page.cookies();
          const session = pageCookies.find(
            c => (c.name === 'LEETCODE_SESSION') && c.value && c.value.length > 20
          );
          if (session) {
            await browser.close().catch(() => {});
            return {
              success: true,
              sessionCookie: session.value,
              source: 'browser_window'
            };
          }
        } catch (_) {}
      }

      // Also check Firefox periodically in case user logged in in Firefox while popup was open
      const periodicFf = await tryExtractFromFirefox();
      if (periodicFf) {
        await browser.close().catch(() => {});
        return {
          success: true,
          sessionCookie: periodicFf,
          source: 'firefox'
        };
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

module.exports = { captureLeetCodeSession, tryExtractFromFirefox };
