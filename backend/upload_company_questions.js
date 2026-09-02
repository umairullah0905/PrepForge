const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const supabase = require('./db'); // Re-use existing supabase connection

const REPO_DIR = path.join(__dirname, 'leetcode-company-wise-problems');

async function processAllCompanies() {
    console.log('Starting upload...');
    const companies = fs.readdirSync(REPO_DIR).filter(file => {
        return fs.statSync(path.join(REPO_DIR, file)).isDirectory() && !file.startsWith('.');
    });

    console.log(`Found ${companies.length} companies. Aggregating data...`);
    
    // Map to store unique questions. Key: Title
    const questionsMap = new Map();

    for (const company of companies) {
        let targetCsv = path.join(REPO_DIR, company, '5. All.csv');
        
        if (!fs.existsSync(targetCsv)) {
            const files = fs.readdirSync(path.join(REPO_DIR, company));
            const csvFiles = files.filter(f => f.endsWith('.csv'));
            if (csvFiles.length > 0) {
                const alt = csvFiles.find(f => f.toLowerCase().includes('all')) || csvFiles[0];
                targetCsv = path.join(REPO_DIR, company, alt);
            } else {
                continue; // No CSV found for this company
            }
        }

        await new Promise((resolve, reject) => {
            fs.createReadStream(targetCsv)
                .pipe(csv())
                .on('data', (data) => {
                    const title = data['Title'] || '';
                    if (!title) return;

                    if (!questionsMap.has(title)) {
                        questionsMap.set(title, {
                            title: title,
                            company_names: new Set([company]),
                            difficulty: data['Difficulty'] || '',
                            acceptance_rate: parseFloat(data['Acceptance Rate']) || 0,
                            link: data['Link'] || '',
                            topics: data['Topics'] || ''
                        });
                    } else {
                        questionsMap.get(title).company_names.add(company);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });
    }

    // Convert Sets to Arrays for Supabase insert
    const recordsToInsert = Array.from(questionsMap.values()).map(q => ({
        ...q,
        company_names: Array.from(q.company_names)
    }));

    console.log(`Aggregated ${recordsToInsert.length} unique questions.`);
    console.log('Uploading to Supabase in batches...');

    const batchSize = 1000;
    let inserted = 0;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        const { data, error } = await supabase
            .from('company_questions')
            .insert(batch);
        
        if (error) {
            console.error(`Error inserting batch:`, error.message);
            // It might fail if RLS is enabled and INSERT is not allowed, or unique constraint fails
        } else {
            inserted += batch.length;
            console.log(`Uploaded ${inserted} / ${recordsToInsert.length} questions...`);
        }
    }
    
    console.log('Finished upload.');
}

processAllCompanies().catch(console.error);

