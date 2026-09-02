const supabase = require('./db');

async function testQuery() {
    console.log('Testing topic query for array:');
    let { data, error } = await supabase
        .from('company_questions')
        .select('*')
        .ilike('topics', '%Array%')
        .limit(5);
        
    console.log('Topic Result:', error ? error.message : data.length + ' rows found.');
    if (data && data.length > 0) console.log(data[0].topics);

    console.log('Testing company query for google:');
    let { data: cData, error: cError } = await supabase
        .from('company_questions')
        .select('*')
        .contains('company_names', ['Google'])
        .limit(5);

    console.log('Company Result:', cError ? cError.message : cData.length + ' rows found.');
    
    console.log('Testing lowercase tcs:');
    let { data: tData, error: tError } = await supabase
        .from('company_questions')
        .select('*')
        .contains('company_names', ['tcs'])
        .limit(5);

    console.log('tcs Result:', tError ? tError.message : tData.length + ' rows found.');
}

testQuery();
