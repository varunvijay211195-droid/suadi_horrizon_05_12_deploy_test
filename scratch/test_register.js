
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRegister() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  console.log(`Testing registration for ${email}...`);
  
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('SignUp Error:', signUpError.message);
    return;
  }

  console.log('SignUp successful. User ID:', data.user.id);

  console.log('Attempting to upsert to public.users table...');
  const { error: upsertError } = await supabase.from('users').upsert({
    id: data.user.id,
    email,
    name: 'Test User',
    role: 'customer',
    created_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error('Upsert Error:', upsertError.message);
  } else {
    console.log('Upsert successful!');
  }
}

testRegister();
