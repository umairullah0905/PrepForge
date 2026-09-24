// PrepForge Companion Extension - Content Script
// Bridges communication between PrepForge web app and extension background worker.

(function () {
  // Mark extension presence in the DOM
  document.documentElement.dataset.prepforgeExtension = "true";

  function announceExtension() {
    window.postMessage(
      {
        type: "PREPFORGE_EXTENSION_LOADED",
        version: "1.0.0",
      },
      "*"
    );
  }

  // Announce immediately and when requested
  announceExtension();

  window.addEventListener("message", async (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    const message = event.data;
    if (!message || typeof message !== "object") return;

    if (message.type === "PREPFORGE_PING_EXTENSION") {
      announceExtension();
      return;
    }

    if (message.type === "PREPFORGE_REQUEST_LEETCODE_SESSION") {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "GET_LEETCODE_SESSION",
        });
        window.postMessage(
          {
            type: "PREPFORGE_RESPONSE_LEETCODE_SESSION",
            data: response,
          },
          "*"
        );
      } catch (err) {
        window.postMessage(
          {
            type: "PREPFORGE_RESPONSE_LEETCODE_SESSION",
            data: {
              success: false,
              error: err.message || "Failed to communicate with extension worker.",
            },
          },
          "*"
        );
      }
    }

    if (message.type === "PREPFORGE_REQUEST_CODEFORCES_SESSION") {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "GET_CODEFORCES_SESSION",
        });
        window.postMessage(
          {
            type: "PREPFORGE_RESPONSE_CODEFORCES_SESSION",
            data: response,
          },
          "*"
        );
      } catch (err) {
        window.postMessage(
          {
            type: "PREPFORGE_RESPONSE_CODEFORCES_SESSION",
            data: {
              success: false,
              error: err.message || "Failed to communicate with extension worker.",
            },
          },
          "*"
        );
      }
    }
  });
})();
