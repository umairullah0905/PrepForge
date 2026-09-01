const axios = require('axios');
const cheerio = require('cheerio');
const supabase = require('./db');

async function fetchCodeforcesQuestions(limit = 5, topic = "") {
  try {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());

    console.log(`Fetching problem list from Codeforces API (Topic: ${topic || 'All'})...`);
    let url = 'https://codeforces.com/api/problemset.problems';
    if (topic) {
      url += `?tags=${encodeURIComponent(topic)}`;
    }
    const response = await axios.get(url);
    if (response.data.status !== 'OK') {
      throw new Error("Codeforces API error");
    }

    const problems = response.data.result.problems.slice(0, limit);

    console.log("Launching Puppeteer to bypass Cloudflare...");
    const browser = await puppeteer.launch({ 
      headless: 'new',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    for (const prob of problems) {
      console.log(`Fetching details for Codeforces ${prob.contestId}${prob.index} - ${prob.name}`);
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      await fetchAndSaveCodeforcesDetails(page, prob);
      
      await page.close();
      
      // Wait a random amount of time between 5 and 10 seconds to avoid Cloudflare rate limits
      const delay = Math.floor(Math.random() * 5000) + 5000;
      console.log(`Waiting for ${delay/1000}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await browser.close();
    console.log("Codeforces fetching complete!");
    return { success: true, count: problems.length };
  } catch (error) {
    console.error("Error fetching Codeforces problems:", error.message);
    return { success: false, error: error.message };
  }
}

async function fetchAndSaveCodeforcesDetails(page, prob) {
  const url = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;
  
  try {
    // Navigate and wait for the problem statement to appear (bypasses Cloudflare challenge)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Check if Cloudflare is challenging, wait for the actual content
    try {
      await page.waitForSelector('.problem-statement', { timeout: 15000 });
    } catch (e) {
      console.log(`Timeout waiting for .problem-statement on ${url}. Might be stuck on Cloudflare.`);
      return;
    }

    const contentHtml = await page.content();
    const $ = cheerio.load(contentHtml);
    
    const statement = $('.problem-statement');
    
    // Remove the header as it just has time limits and title which we already have
    statement.find('.header').remove();
    
    const descriptionHtml = statement.html();
    
    if (!descriptionHtml) {
        console.log(`Could not parse HTML for ${prob.contestId}${prob.index}`);
        return;
    }

    const platformId = `${prob.contestId}${prob.index}`;
    let difficulty = 'Unknown';
    if (prob.rating) {
      if (prob.rating < 1200) difficulty = 'Easy';
      else if (prob.rating < 1900) difficulty = 'Medium';
      else difficulty = 'Hard';
    }

    // Try to find the tutorial/solution link in the sidebar
    let solutionLink = '';
    const tutorialAnchor = $('.roundbox.sidebox a').filter(function() {
      return $(this).text().toLowerCase().includes('tutorial');
    }).first();
    
    if (tutorialAnchor.length > 0) {
      solutionLink = 'https://codeforces.com' + tutorialAnchor.attr('href');
    }

    const { data, error } = await supabase
      .from('questions')
      .upsert({
        platform: 'Codeforces',
        platform_id: platformId,
        title: prob.name,
        url: url,
        solution_link: solutionLink,
        description: descriptionHtml,
        difficulty: difficulty,
        topics: prob.tags || [],
        test_cases: "See description for sample tests"
      }, { onConflict: 'platform,platform_id' });

    if (error) {
      console.error(`Error saving ${platformId} to Supabase:`, error.message);
    } else {
      console.log(`Saved ${platformId} successfully.`);
    }

  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
  }
}

module.exports = { fetchCodeforcesQuestions };
