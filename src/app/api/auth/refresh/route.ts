import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken } = body;

        // Validation
        if (!refreshToken) {
            return NextResponse.json(
                { success: false, message: 'Refresh token is required' },
                { status: 401 }
            );
        }

        // Create Supabase client with anon key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Refresh the session using the refresh token
        const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (refreshError || !sessionData.session) {
            console.error('Token refresh error:', refreshError);
            return NextResponse.json(
                { success: false, message: 'Invalid refresh token' },
                { status: 403 }
            );
        }

        // Return new tokens
        return NextResponse.json({
            success: true,
            data: {
                user: sessionData.user,
                accessToken: sessionData.session.access_token,
                refreshToken: sessionData.session.refresh_token,
            },
        });
    } catch (error: unknown) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { success: false, message: 'Token refresh failed' },
            { status: 500 }
        );
    }
}
