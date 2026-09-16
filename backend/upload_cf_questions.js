const fs = require('fs');
const path = require('path');
const supabase = require('./db');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateDescription(q) {
  const safeTitle = escapeHtml(q.title);
  const topicsHtml = q.topics && q.topics.length > 0 
    ? q.topics.map(t => `<span style="display:inline-block;background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:4px;margin:2px;font-size:0.85rem;">${escapeHtml(t)}</span>`).join(' ')
    : '<span>General</span>';

  return `
<div class="problem-statement">
  <div class="header" style="margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">${safeTitle}</h2>
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
      <span style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); padding: 2px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;">Codeforces ${q.platform_id}</span>
      <span style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); padding: 2px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600;">${q.difficulty}${q.rating ? ` (${q.rating})` : ''}</span>
    </div>
  </div>

  <div class="statement-body" style="line-height: 1.6; color: #e5e7eb;">
    <p>This challenge is from <strong>Codeforces Round / Problemset (${q.platform_id})</strong>.</p>
    
    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 1.25rem; margin: 1.25rem 0;">
      <h3 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 0.75rem; color: #f3f4f6;">Problem Overview</h3>
      <ul style="list-style-type: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
        <li><strong style="color: #9ca3af;">Contest:</strong> #${q.contest_id}</li>
        <li><strong style="color: #9ca3af;">Index:</strong> ${q.index}</li>
        <li><strong style="color: #9ca3af;">Difficulty:</strong> ${q.difficulty}</li>
        ${q.rating ? `<li><strong style="color: #9ca3af;">Rating:</strong> ${q.rating}</li>` : ''}
      </ul>
      <div style="margin-top: 0.75rem;">
        <strong style="color: #9ca3af; display: block; margin-bottom: 0.25rem;">Topics:</strong>
        <div>${topicsHtml}</div>
      </div>
    </div>

    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin: 1.5rem 0;">
      <a href="${q.url}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #2563eb; color: #ffffff; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.9rem;">
        View on Codeforces ↗
      </a>
      ${q.solution_link ? `
      <a href="${q.solution_link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(220, 38, 38, 0.2); color: #fca5a5; border: 1px solid rgba(220, 38, 38, 0.4); padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.9rem;">
        Watch Video Editorial ↗
      </a>` : ''}
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; margin-top: 1.5rem; font-size: 0.9rem; color: #9ca3af;">
      <p>Solve this problem right here on <strong>InterviewOS</strong>. Write your code in the editor and click <strong>Submit</strong> to evaluate your solution directly on Codeforces.</p>
    </div>
  </div>
</div>
  `.trim();
}

async function uploadQuestions() {
  console.log("Starting Codeforces questions upload to Supabase...");

  // 1. Fetch existing Codeforces questions to preserve existing descriptions
  const { data: existingRows, error: fetchErr } = await supabase
    .from('questions')
    .select('platform_id,description')
    .eq('platform', 'Codeforces');

  if (fetchErr) {
    console.error("Error checking existing questions:", fetchErr.message);
    process.exit(1);
  }

  const existingMap = new Map();
  for (const r of existingRows || []) {
    existingMap.set(r.platform_id, r.description);
  }
  console.log(`Found ${existingMap.size} existing Codeforces questions in database.`);

  // 2. Load prepared questions
  const jsonPath = path.join(__dirname, 'prepared_cf_questions.json');
  if (!fs.existsSync(jsonPath)) {
    console.error("prepared_cf_questions.json not found!");
    process.exit(1);
  }
  const questions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${questions.length} questions from prepared_cf_questions.json.`);

  // 3. Prepare payload
  const records = questions.map(q => {
    // Preserve existing description if it already has one with substance
    let description = existingMap.get(q.platform_id);
    if (!description || description.length < 200) {
      description = generateDescription(q);
    }

    return {
      platform: 'Codeforces',
      platform_id: q.platform_id,
      title: q.title,
      url: q.url,
      description: description,
      difficulty: q.difficulty,
      topics: q.topics || ['algorithms'],
      test_cases: 'See description for sample tests',
      solution_link: q.solution_link || null
    };
  });

  // 4. Batch upsert in chunks of 50
  const CHUNK_SIZE = 50;
  let insertedTotal = 0;
  let errors = [];

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    console.log(`Upserting chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(records.length / CHUNK_SIZE)} (items ${i + 1} - ${i + chunk.length})...`);
    
    const { data, error } = await supabase
      .from('questions')
      .upsert(chunk, { onConflict: 'platform,platform_id' })
      .select('id,platform_id');

    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE + 1}:`, error.message);
      errors.push({ chunk: i / CHUNK_SIZE + 1, error: error.message });
    } else {
      insertedTotal += chunk.length;
      console.log(`Successfully upserted chunk (${insertedTotal}/${records.length}).`);
    }
  }

  console.log(`\n================ Summary ================`);
  console.log(`Total questions processed: ${records.length}`);
  console.log(`Successfully upserted: ${insertedTotal}`);
  if (errors.length > 0) {
    console.error(`Encountered ${errors.length} errors:`, errors);
  }

  // 5. Query final count
  const { count, error: countErr } = await supabase
    .from('questions')
    .select('count', { count: 'exact' })
    .eq('platform', 'Codeforces');

  console.log(`Final Codeforces questions count in Supabase: ${count}`);
  process.exit(errors.length > 0 ? 1 : 0);
}

uploadQuestions().catch(err => {
  console.error("Fatal error during upload:", err);
  process.exit(1);
});
