const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin(email, password) {
    console.log(`Attempting to create admin user: ${email}`);

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            name: 'Varun Vijay', l-
            role: 'admin'
        }
    });

if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists in Auth. Proceeding to update role in users table...');
        // Get user ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        if (!existingUser) {
            console.error('Could not find existing user ID');
            return;
        }
        updateUserRole(existingUser.id, email);
    } else {
        console.error('Error creating user in Auth:', authError.message);
    }
    return;
}

console.log('User created in Auth successfully:', authData.user.id);
updateUserRole(authData.user.id, email);
}

async function updateUserRole(userId, email) {
    console.log(`Updating role to admin for user ID: ${userId}`);

    // 2. Upsert into public.users table
    const { error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: email,
            role: 'admin',
            profile: {
                name: 'Varun Vijay'
            },
            updated_at: new Date().toISOString()
        });

    if (upsertError) {
        console.error('Error updating role in users table:', upsertError.message);
    } else {
        console.log('Admin role granted successfully in users table.');
        console.log(`Credentials:\nEmail: ${email}\nPassword: qwerty123`);
    }
}

createAdmin('varunvijay235@gmail.com', 'qwerty123');
