import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create Supabase client with anon key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Supabase logout error:', error);
            return NextResponse.json(
                { message: 'Logout failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'User logged out successfully',
        });
    } catch (error: unknown) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { message: 'Logout failed' },
            { status: 500 }
        );
    }
}
