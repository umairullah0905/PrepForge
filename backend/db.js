require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_project_url_here')) {
  console.error("Missing or invalid Supabase credentials in .env");
  console.error("Please update backend/.env with your Supabase URL and Service Role Key.");
  process.exit(1);
}

const ws = require('ws');
globalThis.WebSocket = ws;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    transport: ws
  }
});

module.exports = supabase;
