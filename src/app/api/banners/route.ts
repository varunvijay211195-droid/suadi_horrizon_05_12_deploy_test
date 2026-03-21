import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/banners?position=hero  — public, no auth required
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { searchParams } = new URL(request.url);
        const position = searchParams.get('position');

        let query = supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (position) {
            query = query.eq('position', position);
        }

        const { data: banners, error } = await query;

        if (error) {
            console.error('Error fetching public banners:', error);
            return NextResponse.json({ banners: [] });
        }

        return NextResponse.json({ banners: banners || [] });
    } catch (error) {
        console.error('Error fetching public banners:', error);
        return NextResponse.json({ banners: [] });
    }
}
