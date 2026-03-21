import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        id: string;
        email: string | undefined;
        role?: string;
    };
}

interface TokenPayload {
    sub: string;
    email?: string;
    role?: string;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
    // 1. Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 2. Check cookies
    const tokenCookie = request.cookies.get('accessToken') || request.cookies.get('token');
    if (tokenCookie) {
        return tokenCookie.value;
    }

    return null;
}

/**
 * Verify authentication token and return user payload using Supabase
 */
export async function verifyAuth(request: NextRequest): Promise<TokenPayload | null> {
    try {
        const token = extractToken(request);

        if (!token) {
            return null;
        }

        // Validate environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing required Supabase environment variables');
            throw new Error('Server configuration error');
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify the token using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return null;
        }

        return {
            sub: user.id,
            email: user.email,
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Middleware to require authentication
 * Returns user payload or throws 401 error
 */
export async function requireAuth(request: NextRequest): Promise<TokenPayload> {
    const user = await verifyAuth(request);

    if (!user) {
        throw new Error('Unauthorized');
    }

    return user;
}
