
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Checking user: elite.admin@saudihost.com');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'elite.admin@saudihost.com')
    .single();

  if (error) {
    console.error('Error fetching user:', error.message);
  } else {
    console.log('User found in public.users:');
    console.log('ID:', data.id);
    console.log('Role:', data.role);
    console.log('Has Password Hash:', !!data.password);
  }

  console.log('\nChecking Supabase Auth users...');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error listing auth users:', authError.message);
  } else {
    const adminAuthUser = authData.users.find(u => u.email === 'elite.admin@saudihost.com');
    if (adminAuthUser) {
      console.log('User found in auth.users:');
      console.log('ID:', adminAuthUser.id);
      console.log('Email Confirmed:', !!adminAuthUser.email_confirmed_at);
    } else {
      console.log('User NOT found in auth.users');
    }
  }
}

checkAdmin();
