
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function promoteAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('Promoting elite.admin@saudihost.com to admin role...');
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', 'elite.admin@saudihost.com')
    .select();

  if (error) {
    console.error('Error updating role:', error.message);
  } else {
    console.log('Update successful:', JSON.stringify(data, null, 2));
  }
}

promoteAdmin();
