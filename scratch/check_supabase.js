
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSupabaseAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('--- Supabase Auth/DB Check ---');
  
  // 1. Check if user exists in public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', 'elite.admin@saudihost.com')
    .single();

  if (userError) {
    console.log('User not found in public.users table:', userError.message);
  } else {
    console.log('User found in public.users table:', JSON.stringify(userData, null, 2));
  }

  // 2. Check if user exists in auth.users (via admin API)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError.message);
  } else {
    const adminUser = authData.users.find(u => u.email === 'elite.admin@saudihost.com');
    if (adminUser) {
      console.log('User found in auth.users:', JSON.stringify({
        id: adminUser.id,
        email: adminUser.email,
        last_sign_in_at: adminUser.last_sign_in_at
      }, null, 2));
    } else {
      console.log('User NOT found in auth.users');
    }
  }
}

checkSupabaseAuth();
