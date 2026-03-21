
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'varun@suadihorizon.online';
  console.log(`Checking user: ${email}`);
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  
  if (user) {
    console.log('User found in auth.users:');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Last Sign In: ${user.last_sign_in_at}`);
  } else {
    console.log('User NOT found in auth.users');
    
    // Check public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (publicUser) {
        console.log('User found in public.users:');
        console.log(publicUser);
    } else {
        console.log('User NOT found in public.users either');
    }
  }
}

checkUser();
