const { submitToCodeforces } = require('./codeforces_submit');

let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const payload = JSON.parse(inputData);
    const result = await submitToCodeforces(payload);
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: err.message || 'CF Runner error' }));
    process.exit(1);
  }
});
