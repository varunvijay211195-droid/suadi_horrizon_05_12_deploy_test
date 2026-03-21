import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const payload = await verifyAuth(request);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.sub;
        const supabase = createClient();

        const { data: quotes, error } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Normalize for frontend compatibility if needed
        const mappedQuotes = (quotes || []).map(q => ({
            ...q,
            _id: q.id, // Legacy compatibility
            userId: q.user_id,
            createdAt: q.created_at,
            updatedAt: q.updated_at
        }));

        return NextResponse.json({ quotes: mappedQuotes });
    } catch (error: any) {
        console.error('Error fetching user quotes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotes' },
            { status: 500 }
        );
    }
}
