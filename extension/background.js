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

async function handleGetLeetCodeSession() {
  try {
    const cookie = await chrome.cookies.get({
      url: "https://leetcode.com",
      name: "LEETCODE_SESSION",
    });

    if (!cookie || !cookie.value) {
      return {
        success: false,
        error: "No active LeetCode session found. Please make sure you are logged in at leetcode.com.",
      };
    }

    return {
      success: true,
      sessionCookie: cookie.value,
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
    const cookies = await chrome.cookies.getAll({ domain: "codeforces.com" });
    if (!cookies || cookies.length === 0) {
      return {
        success: false,
        error: "No Codeforces cookies found. Please make sure you are logged in at codeforces.com.",
      };
    }

    // Format into standard Cookie header string
    const cookieHeader = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    // Check for user handle if present in cookies or format JSON
    const handleCookie = cookies.find((c) => c.name.toLowerCase().includes("handle"));

    return {
      success: true,
      sessionCookies: cookieHeader,
      handle: handleCookie ? handleCookie.value : null,
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
