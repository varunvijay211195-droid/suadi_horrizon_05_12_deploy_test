import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ idOrSlug: string }> }
) {
    try {
        const { idOrSlug } = await context.params;
        const supabase = createClient();

        // Check if idOrSlug is a UUID
        const isUuid = idOrSlug.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

        let query = supabase
            .from('news')
            .select('*')
            .eq('is_published', true); // Public can only see published

        if (isUuid) {
            query = query.eq('id', idOrSlug);
        } else {
            query = query.eq('slug', idOrSlug);
        }

        const { data: news, error } = await query.single();

        if (error || !news) {
            return NextResponse.json(
                { error: 'News article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...news,
            _id: news.id,
            isPublished: news.is_published,
            publishedAt: news.published_at,
            createdAt: news.created_at,
            updatedAt: news.updated_at
        });
    } catch (error: unknown) {
        console.error('Error fetching news article:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news article' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ idOrSlug: string }> }
) {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { idOrSlug } = await context.params;
        const body = await request.json();
        const supabase = createClient();

        // Check if idOrSlug is a UUID
        const isUuid = idOrSlug.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
        const filterField = isUuid ? 'id' : 'slug';

        // Get current data to handle publishedAt logic
        const { data: current, error: fetchError } = await supabase
            .from('news')
            .select('is_published')
            .eq(filterField, idOrSlug)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'News article not found' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = { ...body };
        
        // Handle field mappings
        if (body.isPublished !== undefined) {
            updateData.is_published = body.isPublished;
            delete updateData.isPublished;
            
            // Update publishedAt if publishing for the first time
            if (body.isPublished === true && !current.is_published) {
                updateData.published_at = new Date().toISOString();
            }
        }

        if (body.publishedAt) {
            updateData.published_at = body.publishedAt;
            delete updateData.publishedAt;
        }

        const { data: news, error: updateError } = await supabase
            .from('news')
            .update(updateData)
            .eq(filterField, idOrSlug)
            .select()
            .single();

        if (updateError || !news) {
            return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
        }

        return NextResponse.json({
            ...news,
            _id: news.id,
            isPublished: news.is_published,
            publishedAt: news.published_at,
            createdAt: news.created_at,
            updatedAt: news.updated_at
        });
    } catch (error: unknown) {
        console.error('Error updating news:', error);
        return NextResponse.json(
            { error: 'Failed to update news' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ idOrSlug: string }> }
) {
    // Verify admin authentication
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { idOrSlug } = await context.params;
        const supabase = createClient();

        // Check if idOrSlug is a UUID
        const isUuid = idOrSlug.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
        const filterField = isUuid ? 'id' : 'slug';

        const { error: deleteError } = await supabase
            .from('news')
            .delete()
            .eq(filterField, idOrSlug);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
        }

        return NextResponse.json({ message: 'News article deleted' });
    } catch (error: unknown) {
        console.error('Error deleting news:', error);
        return NextResponse.json(
            { error: 'Failed to delete news' },
            { status: 500 }
        );
    }
}
