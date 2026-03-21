import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/notifications/userNotifications';
import { notifyNewUser } from '@/lib/notifications/adminNotifications';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        // Create Supabase client with anon key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    phone: phone || '',
                }
            }
        });

        if (authError) {
            console.error('Supabase registration error:', authError);
            
            // Check if user already exists
            if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
                return NextResponse.json(
                    { message: 'User with this email already exists' },
                    { status: 409 }
                );
            }
            
            return NextResponse.json(
                { message: authError.message || 'Registration failed' },
                { status: 500 }
            );
        }

        // Create user record in users table (if it exists)
        if (authData.user) {
            try {
                await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: authData.user.email,
                        name: name,
                        phone: phone || '',
                        role: 'customer',
                        created_at: new Date().toISOString(),
                    });
            } catch {
                // Ignore if table doesn't exist
            }
        }

        // --- Notifications (Non-blocking) ---
        
        // 1. Send Welcome Email to User
        sendWelcomeEmail(email, name).catch(err => console.error('Welcome email failed:', err));

        // 2. Notify Admin about new registration
        notifyNewUser(name, email).catch(err => console.error('Admin notification failed:', err));

        // Get session tokens
        const accessToken = authData.session?.access_token;
        const refreshToken = authData.session?.refresh_token;

        return NextResponse.json({
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: authData.user?.id,
                email: authData.user?.email,
                name: name,
                role: 'customer',
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
