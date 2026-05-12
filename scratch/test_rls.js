
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey);

  console.log('Testing SELECT from public.users with anon key...');
  const { data, error } = await supabase.from('users').select('id').limit(1);

  if (error) {
    console.error('SELECT Error:', error.message);
    if (error.message.includes('permission denied')) {
        console.log('Likely cause: RLS is enabled on "users" but no policy exists for anon SELECT.');
    }
  } else {
    console.log('SELECT successful, found:', data.length, 'records.');
  }

  console.log('Testing INSERT to public.users with anon key...');
  const { error: insertError } = await supabase.from('users').insert({
    email: 'rls_test@example.com',
    profile: { name: 'RLS Test' }
  });

  if (insertError) {
    console.error('INSERT Error:', insertError.message);
  } else {
    console.log('INSERT successful!');
  }
}

testRLS();
