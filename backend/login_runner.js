const { captureLeetCodeSession } = require('./leetcode_login');

(async () => {
  try {
    const result = await captureLeetCodeSession();
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: err.message || 'Login runner error' }));
    process.exit(1);
  }
})();
