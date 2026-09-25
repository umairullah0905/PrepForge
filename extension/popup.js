document.addEventListener("DOMContentLoaded", async () => {
  const lcEl = document.getElementById("lc-status");
  const cfEl = document.getElementById("cf-status");

  try {
    const res = await chrome.runtime.sendMessage({ type: "GET_ALL_SESSIONS" });

    if (res.leetcode && res.leetcode.success) {
      lcEl.textContent = "Detected";
      lcEl.className = "badge badge-ok";
    } else {
      lcEl.textContent = "Not Logged In";
      lcEl.className = "badge badge-no";
    }

    if (res.codeforces && res.codeforces.success) {
      cfEl.textContent = res.codeforces.handle ? `Detected (${res.codeforces.handle})` : "Detected";
      cfEl.className = "badge badge-ok";
    } else {
      cfEl.textContent = "Not Logged In";
      cfEl.className = "badge badge-no";
    }
  } catch (e) {
    lcEl.textContent = "Error";
    cfEl.textContent = "Error";
  }
});
