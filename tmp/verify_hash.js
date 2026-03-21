
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await s.from('users').select('password').eq('email', 'varun@suadihorizon.online').single();
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Hash found:', !!data.password);
  if (data.password) {
    console.log('Hash length:', data.password.length);
    console.log('Starts with $2:', data.password.startsWith('$2'));
    console.log('First 10 chars:', data.password.substring(0, 10));
  }
}
run();
