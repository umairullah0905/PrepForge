const express = require('express');
const cors = require('cors');
const { fetchLeetCodeQuestions } = require('./leetcode');
const { fetchCodeforcesQuestions } = require('./codeforces');

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend API Server running on http://localhost:${PORT}`);
});
