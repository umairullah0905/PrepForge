// PrepForge Companion Extension - Background Service Worker (Manifest V3)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_LEETCODE_SESSION") {
    handleGetLeetCodeSession().then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.type === "GET_CODEFORCES_SESSION") {
    handleGetCodeforcesSession().then(sendResponse);
    return true;
  }

  if (request.type === "GET_ALL_SESSIONS") {
    handleGetAllSessions().then(sendResponse);
    return true;
  }
});

/**
 * Universal cookie retriever across multiple domains, URLs, stores, and partition states.
 */
async function getAllCookiesForService(domains, urls) {
  const cookieMap = new Map();

  let stores = [];
  try {
    stores = await chrome.cookies.getAllCookieStores();
  } catch (_) {}

  const storeIds = stores.length > 0 ? stores.map((s) => s.id) : [undefined];

  for (const storeId of storeIds) {
    // 1. Query by domain patterns
    for (const domain of domains) {
      try {
        const q = storeId ? { domain, storeId } : { domain };
        const cookies = await chrome.cookies.getAll(q);
        if (cookies && cookies.length > 0) {
          for (const c of cookies) {
            cookieMap.set(`${c.name}@${c.domain || ""}${c.path || ""}`, c);
          }
        }
      } catch (_) {}

      // Partitioned cookies (CHIPS)
      try {
        const qPart = storeId ? { domain, storeId, partitionKey: {} } : { domain, partitionKey: {} };
        const cookies = await chrome.cookies.getAll(qPart);
        if (cookies && cookies.length > 0) {
          for (const c of cookies) {
            cookieMap.set(`${c.name}@${c.domain || ""}${c.path || ""}`, c);
          }
        }
      } catch (_) {}
    }

    // 2. Query by URL patterns
    for (const url of urls) {
      try {
        const q = storeId ? { url, storeId } : { url };
        const cookies = await chrome.cookies.getAll(q);
        if (cookies && cookies.length > 0) {
          for (const c of cookies) {
            cookieMap.set(`${c.name}@${c.domain || ""}${c.path || ""}`, c);
          }
        }
      } catch (_) {}

      // Partitioned cookies (CHIPS)
      try {
        const qPart = storeId ? { url, storeId, partitionKey: {} } : { url, partitionKey: {} };
        const cookies = await chrome.cookies.getAll(qPart);
        if (cookies && cookies.length > 0) {
          for (const c of cookies) {
            cookieMap.set(`${c.name}@${c.domain || ""}${c.path || ""}`, c);
          }
        }
      } catch (_) {}
    }
  }

  return Array.from(cookieMap.values());
}

/**
 * Attempts to detect the logged-in Codeforces handle via tabs or cookies.
 */
async function detectCodeforcesHandle(cookies) {
  // 1. Check cookies for X-User or handle
  const xUser = cookies.find((c) => c.name.toLowerCase() === "x-user");
  if (xUser && xUser.value) {
    try {
      const decoded = decodeURIComponent(xUser.value);
      if (decoded && !["enter", "login", "register", "profile"].includes(decoded.toLowerCase())) {
        return decoded;
      }
    } catch (_) {}
  }

  const handleCookie = cookies.find((c) => c.name.toLowerCase().includes("handle"));
  if (handleCookie && handleCookie.value) {
    return handleCookie.value;
  }

  // 2. Inspect open Codeforces tabs if user has one open in Chrome
  try {
    if (chrome.tabs && chrome.scripting) {
      const tabs = await chrome.tabs.query({ url: "*://*.codeforces.com/*" });
      for (const tab of tabs) {
        if (!tab.id) continue;
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Priority 1: #header / .lang-chooser profile link
              const headerLinks = Array.from(
                document.querySelectorAll('#header a[href*="/profile/"], .lang-chooser a[href*="/profile/"]')
              );
              for (const a of headerLinks) {
                const href = a.getAttribute("href") || "";
                const match = href.match(/\/profile\/([a-zA-Z0-9_\-]+)/);
                if (match && match[1]) {
                  const text = (a.textContent || "").trim();
                  const candidate = text || match[1];
                  if (!["enter", "login", "register", "profile"].includes(candidate.toLowerCase())) {
                    return candidate;
                  }
                }
              }

              // Priority 2: any link matching /profile/<username>
              const allProfileLinks = Array.from(document.querySelectorAll('a[href^="/profile/"]'));
              for (const a of allProfileLinks) {
                const href = a.getAttribute("href") || "";
                const match = href.match(/^\/profile\/([a-zA-Z0-9_\-]+)$/);
                if (match && match[1]) {
                  if (!["enter", "login", "register", "profile"].includes(match[1].toLowerCase())) {
                    return match[1];
                  }
                }
              }

              return null;
            },
          });

          if (results && results[0] && results[0].result) {
            return results[0].result;
          }
        } catch (_) {}

        // Priority 3: check tab URL if on profile page
        if (tab.url) {
          const urlMatch = tab.url.match(/codeforces\.com\/profile\/([a-zA-Z0-9_\-]+)/);
          if (urlMatch && urlMatch[1] && !["enter", "login", "register", "profile"].includes(urlMatch[1].toLowerCase())) {
            return urlMatch[1];
          }
        }
      }
    }
  } catch (_) {}

  // 3. Try background fetch with credentials included
  try {
    const res = await fetch("https://codeforces.com/", { credentials: "include" });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/href=["']\/profile\/([a-zA-Z0-9_\-]+)["']/i);
      if (match && match[1] && !["enter", "login", "register", "profile"].includes(match[1].toLowerCase())) {
        return match[1];
      }
    }
  } catch (_) {}

  return null;
}

async function handleGetLeetCodeSession() {
  try {
    const cookies = await getAllCookiesForService(
      ["leetcode.com", ".leetcode.com"],
      ["https://leetcode.com", "https://leetcode.com/", "http://leetcode.com"]
    );

    const sessionCookie = cookies.find((c) => c.name === "LEETCODE_SESSION");

    if (!sessionCookie || !sessionCookie.value) {
      return {
        success: false,
        error: "No active LeetCode session found. Please make sure you are logged in at leetcode.com.",
      };
    }

    return {
      success: true,
      sessionCookie: sessionCookie.value,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to retrieve LeetCode session cookie.",
    };
  }
}

async function handleGetCodeforcesSession() {
  try {
    const cookies = await getAllCookiesForService(
      ["codeforces.com", ".codeforces.com", "www.codeforces.com", "m.codeforces.com"],
      [
        "https://codeforces.com",
        "https://codeforces.com/",
        "http://codeforces.com",
        "http://codeforces.com/",
        "https://www.codeforces.com",
        "https://m.codeforces.com",
      ]
    );

    if (!cookies || cookies.length === 0) {
      return {
        success: false,
        error: "No Codeforces cookies found. Please make sure you are logged in at codeforces.com in this browser profile.",
      };
    }

    // Format into standard Cookie header string
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Check if user is logged in and extract handle
    const handle = await detectCodeforcesHandle(cookies);

    return {
      success: true,
      sessionCookies: cookieHeader,
      handle: handle || null,
      rawCookies: cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      })),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to retrieve Codeforces cookies.",
    };
  }
}

async function handleGetAllSessions() {
  const [lc, cf] = await Promise.all([
    handleGetLeetCodeSession(),
    handleGetCodeforcesSession(),
  ]);

  return {
    leetcode: lc,
    codeforces: cf,
  };
}
