import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeNews(n: Record<string, unknown>) {
    return {
        _id: n.id, // Legacy support
        id: n.id,
        title: n.title,
        slug: n.slug,
        content: n.content,
        excerpt: n.excerpt,
        image: n.image,
        category: n.category,
        author: n.author,
        isPublished: n.is_published,
        publishedAt: n.published_at,
        createdAt: n.created_at,
        updatedAt: n.updated_at
    };
}

export async function GET() {
    try {
        const supabase = createClient();

        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false });

        if (error) {
            console.error('Error fetching news:', error);
            return NextResponse.json(
                { error: 'Failed to fetch news' },
                { status: 500 }
            );
        }

        const formattedNews = (news || []).map(normalizeNews);
        return NextResponse.json(formattedNews);
    } catch (error: unknown) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        const body = await request.json();
        const { title, content, excerpt, image, category, author, isPublished } = body;

        // Simple slug generation
        const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const { data: news, error } = await supabase
            .from('news')
            .insert({
                title,
                slug,
                content,
                excerpt,
                image,
                category,
                author,
                is_published: isPublished ?? false,
                published_at: isPublished ? new Date().toISOString() : null
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating news:', error);
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json(
                    { error: 'Slug already exists' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Failed to create news' },
                { status: 500 }
            );
        }

        const normalizedNews = normalizeNews(news);
        return NextResponse.json(normalizedNews, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating news:', error);
        return NextResponse.json(
            { error: 'Failed to create news' },
            { status: 500 }
        );
    }
}
