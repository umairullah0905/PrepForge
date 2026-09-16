const fs = require('fs');
const path = require('path');
const supabase = require('./db');

async function updateDescriptions() {
  const statementsFile = path.join(__dirname, 'cf_statements.json');
  if (!fs.existsSync(statementsFile)) {
    console.error("cf_statements.json not found!");
    process.exit(1);
  }

  const statements = JSON.parse(fs.readFileSync(statementsFile, 'utf8'));
  const pids = Object.keys(statements);
  console.log(`Loaded ${pids.length} statements from cf_statements.json.`);

  let updatedCount = 0;
  let failCount = 0;

  // Process in batches of 25 for fast parallel Supabase updates
  const BATCH_SIZE = 25;
  for (let i = 0; i < pids.length; i += BATCH_SIZE) {
    const batchPids = pids.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batchPids.map(async (pid) => {
        const desc = statements[pid];
        if (!desc) return;

        const { error } = await supabase
          .from('questions')
          .update({ description: desc })
          .eq('platform', 'Codeforces')
          .eq('platform_id', pid);

        if (error) {
          console.error(`Failed to update ${pid}:`, error.message);
          failCount++;
        } else {
          updatedCount++;
        }
      })
    );

    if ((i + BATCH_SIZE) % 50 === 0 || i + BATCH_SIZE >= pids.length) {
      console.log(`Updated ${Math.min(i + BATCH_SIZE, pids.length)}/${pids.length} questions...`);
    }
  }

  console.log(`\nUpdate finished! Successfully updated: ${updatedCount}, Failed: ${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
}

updateDescriptions().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
