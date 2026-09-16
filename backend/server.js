const express = require('express');
const cors = require('cors');
const { fetchLeetCodeQuestions } = require('./leetcode');
const { fetchCodeforcesQuestions } = require('./codeforces');
const { submitToLeetCode } = require('./leetcode_submit');
const { captureLeetCodeSession } = require('./leetcode_login');
const { submitToCodeforces } = require('./codeforces_submit');
const { captureCodeforcesSession } = require('./codeforces_login');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/leetcode/login', async (req, res) => {
  try {
    const result = await captureLeetCodeSession();
    res.json(result);
  } catch (error) {
    console.error("LeetCode Login API Error:", error);
    res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

app.post('/api/leetcode/submit', async (req, res) => {
  const { slug, language, code, sessionCookie, questionId } = req.body;

  if (!slug || !code) {
    return res.status(400).json({ error: 'Slug and code are required' });
  }

  try {
    const result = await submitToLeetCode({
      slug,
      language,
      code,
      sessionCookie,
      questionId
    });

    res.json(result);
  } catch (error) {
    console.error("LeetCode Submit API Error:", error);
    res.status(500).json({ error: error.message || 'Submission failed' });
  }
});

app.post('/api/codeforces/login', async (req, res) => {
  try {
    const result = await captureCodeforcesSession();
    res.json(result);
  } catch (error) {
    console.error("Codeforces Login API Error:", error);
    res.status(500).json({ success: false, error: error.message || 'Codeforces login failed' });
  }
});

app.post('/api/codeforces/submit', async (req, res) => {
  const { problemCode, contestId, problemIndex, language, code, sessionCookies, handle } = req.body;

  if (!problemCode && (!contestId || !problemIndex)) {
    return res.status(400).json({ error: 'Problem code (e.g. 1985A) is required' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Source code is required' });
  }

  try {
    const result = await submitToCodeforces({
      problemCode,
      contestId,
      problemIndex,
      language,
      code,
      sessionCookies,
      handle
    });

    res.json(result);
  } catch (error) {
    console.error("Codeforces Submit API Error:", error);
    res.status(500).json({ error: error.message || 'Codeforces submission failed' });
  }
});

app.post('/api/fetch', async (req, res) => {
  const { platform, topic, limit = 5 } = req.body;
  
  if (!platform) {
    return res.status(400).json({ error: 'Platform is required' });
  }

  let result;
  try {
    if (platform.toLowerCase() === 'leetcode') {
      result = await fetchLeetCodeQuestions(limit, topic);
    } else if (platform.toLowerCase() === 'codeforces') {
      result = await fetchCodeforcesQuestions(limit, topic);
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    if (result.success) {
      res.json({ message: `Successfully fetched ${result.count} questions from ${platform}` });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API Server running on port ${PORT}`);
});

