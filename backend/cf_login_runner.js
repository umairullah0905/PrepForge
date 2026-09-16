const { captureCodeforcesSession } = require('./codeforces_login');

(async () => {
  try {
    const result = await captureCodeforcesSession();
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: err.message || 'CF login runner error' }));
    process.exit(1);
  }
})();
