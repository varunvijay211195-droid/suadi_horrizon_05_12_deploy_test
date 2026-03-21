import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify the token and get user
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get additional user data from users table if it exists
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            id: user.id,
            email: user.email,
            role: userData?.role || 'customer',
            name: userData?.name || user.email?.split('@')[0],
            createdAt: userData?.created_at || user.created_at,
            updatedAt: userData?.updated_at || new Date().toISOString(),
        });
    } catch (error: unknown) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { message: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
