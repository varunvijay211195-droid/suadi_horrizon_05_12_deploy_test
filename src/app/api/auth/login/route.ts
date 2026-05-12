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

        console.log(`[Login] Starting authentication for: ${email}`);
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Authenticate with Supabase
        console.log('[Login] Attempting sign-in via Supabase Auth...');
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        // 🟢 Fallback for migrated users who exist in public.users but not in auth.users
        if (authError && (authError.message === 'Invalid login credentials' || authError.status === 400)) {
            console.log('[Login] Standard sign-in failed. Checking for legacy account migration...');
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                const adminClient = createClient(supabaseUrl, serviceRoleKey);
                
                // Check if user exists in public.users
                const { data: legacyUser, error: legacyError } = await adminClient
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (legacyError) {
                    console.log(`[Login] No legacy user found for ${email} or DB error:`, legacyError.message);
                }

                if (legacyUser && legacyUser.password) {
                    console.log('[Login] Legacy user found. Verifying password hash...');
                    const isMatch = await bcrypt.compare(password, legacyUser.password);

                    if (isMatch) {
                        console.log('[Login] Legacy password verified. Auto-provisioning to auth.users...');
                        
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
                            console.log('[Login] User auto-provisioned successfully. Retrying sign-in...');
                            
                            // Now try signing in again with the new auth account
                            const retry = await supabase.auth.signInWithPassword({
                                email,
                                password
                            });
                            
                            if (!retry.error) {
                                console.log('[Login] Retry successful.');
                                authData = retry.data;
                                authError = null;
                            }
                        } else {
                            console.error('[Login] Failed to auto-provision user:', createError.message);
                        }
                    } else {
                        console.log('[Login] Legacy password mismatch.');
                    }
                }
            }
        }

        if (authError) {
            console.error('[Login] Supabase auth error:', authError.message);
            return NextResponse.json(
                { message: authError.message || 'Invalid credentials' },
                { status: 401 }
            );
        }

        console.log('[Login] Auth successful. Fetching profile data...');
        // Get additional user data from users table if it exists
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user!.id)
            .single();

        // Create user record if users table doesn't have it (redundancy)
        if (!userData && authData.user) {
            console.log('[Login] Profile missing from users table. Creating redundant record...');
            try {
                await supabase
                    .from('users')
                    .upsert({
                        id: authData.user.id,
                        email: authData.user.email,
                        created_at: new Date().toISOString(),
                    });
            } catch (err) {
                console.error('[Login] Redundancy check failed:', err);
            }
        }

        // Get the access token from Supabase
        const accessToken = authData.session?.access_token;
        const refreshToken = authData.session?.refresh_token;

        console.log('[Login] All steps complete. Returning response.');
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
    } catch (error: any) {
        console.error('[Login] UNEXPECTED ERROR:', error);
        
        // Handle specific network errors
        if (error.message?.includes('getaddrinfo ENOTFOUND')) {
            return NextResponse.json(
                { message: 'The database is currently unreachable. Please check your internet connection or DNS settings.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
