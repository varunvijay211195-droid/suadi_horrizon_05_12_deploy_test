import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabase = createClient();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status'); // 'published', 'draft', 'all'

        let query = supabase
            .from('news')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        if (status && status !== 'all') {
            if (status === 'published') {
                query = query.eq('is_published', true);
            } else if (status === 'draft') {
                query = query.eq('is_published', false);
            }
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data: articles, count: total, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Map for frontend compatibility
        const mappedArticles = (articles || []).map(n => ({
            ...n,
            _id: n.id,
            isPublished: n.is_published,
            publishedAt: n.published_at,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        }));

        return NextResponse.json({
            articles: mappedArticles,
            pagination: {
                page,
                limit,
                total: total || 0,
                pages: Math.ceil((total || 0) / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching news articles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news articles' },
            { status: 500 }
        );
    }
}
