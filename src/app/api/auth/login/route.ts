import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Validate environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing required Supabase environment variables');
            return NextResponse.json(
                { message: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Authenticate with Supabase
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        // 🟢 Fallback for migrated users who exist in public.users but not in auth.users
        if (authError && (authError.message === 'Invalid login credentials' || authError.status === 400)) {
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                const adminClient = createClient(supabaseUrl, serviceRoleKey);
                
                // Check if user exists in public.users
                const { data: legacyUser } = await adminClient
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (legacyUser && legacyUser.password) {
                    const isMatch = await bcrypt.compare(password, legacyUser.password);

                    if (isMatch) {
                        console.log('Legacy password verified for:', email);
                        
                        // User verified via legacy hash, but doesn't exist in auth.users
                        // Let's create them in auth.users using the SAME id they have in public.users
                        const { error: createError } = await adminClient.auth.admin.createUser({
                            id: legacyUser.id,
                            email: email,
                            password: password,
                            email_confirm: true,
                            user_metadata: legacyUser.profile || {}
                        });

                        if (!createError) {
                            console.log('User auto-provisioned into auth.users:', email);
                            
                            // Now try signing in again with the new auth account
                            const retry = await supabase.auth.signInWithPassword({
                                email,
                                password
                            });
                            
                            if (!retry.error) {
                                authData = retry.data;
                                authError = null;
                            }
                        } else {
                            console.error('Failed to auto-provision user:', createError);
                        }
                    }
                }
            }
        }

        if (authError) {
            console.error('Supabase auth error:', authError);
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Get additional user data from users table if it exists
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user!.id)
            .single();

        // Create user record if users table doesn't have it (redundancy)
        if (!userData && authData.user) {
            try {
                await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: authData.user.email,
                        created_at: new Date().toISOString(),
                    });
            } catch (err) {
                console.error('Error in users table redundancy check:', err);
            }
        }

        // Get the access token from Supabase
        const accessToken = authData.session?.access_token;
        const refreshToken = authData.session?.refresh_token;

        return NextResponse.json({
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: authData.user!.id,
                email: authData.user!.email,
                name: userData?.profile?.name || authData.user!.email?.split('@')[0] || 'User',
                role: userData?.role || 'customer',
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
