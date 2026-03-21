import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function verifyAdminToken(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { error: 'Access denied. No token provided.', status: 401 };
        }

        const token = authHeader.replace('Bearer ', '');

        // Validate environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing required Supabase environment variables');
            return { error: 'Server configuration error.', status: 500 };
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify the token using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Supabase auth verification error:', error);
            return { error: 'Invalid token.', status: 401 };
        }

        // Check if user has admin role in the users table (if it exists)
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = userData?.role || 'customer';

        if (userRole !== 'admin') {
            return { error: 'Access denied. Admin privileges required.', status: 403 };
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                role: userRole
            },
            error: null
        };
    } catch (error: unknown) {
        console.error('Admin auth error:', error);
        return { error: 'Invalid token.', status: 401 };
    }
}
