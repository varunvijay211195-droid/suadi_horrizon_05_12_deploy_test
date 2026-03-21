import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = createClient();

        const adminEmail = 'admin@example.com';
        // Note: Password initialization should be handled via Supabase Auth.
        // This script currently only ensures the database user record exists and has admin role.

        // Check if admin already exists
        const { data: existingAdmin } = await supabase
            .from('users')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (existingAdmin) {
            // Update role to admin just in case
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    role: 'admin',
                    profile: existingAdmin.profile || { name: 'Administrator' }
                })
                .eq('id', existingAdmin.id);

            if (updateError) throw updateError;
            
            return NextResponse.json({ message: 'Admin user updated', email: adminEmail });
        }

        // For new user creation, usually we would use auth.signUp, 
        // but this script seems to be for direct database initialization.
        // If the user doesn't exist in Supabase Auth, they won't be able to log in anyway.
        // We'll insert into users table as requested by the pattern.
        
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                email: adminEmail,
                role: 'admin',
                profile: { name: 'Administrator' }
            });

        if (insertError) throw insertError;

        return NextResponse.json({
            message: 'Admin user record created in database',
            email: adminEmail,
            password: '(Must be set up via Supabase Auth)'
        });

    } catch (error: unknown) {
        console.error('Error creating admin user:', error);
        return NextResponse.json({
            error: (error as Error).message || 'Failed to create admin user'
        }, { status: 500 });
    }
}
