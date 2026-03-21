import { createClient } from '@/lib/supabase/server'

interface CategoryMetadata {
    [key: string]: string | number | boolean | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string | null;
    parent: string | null;
    display_order: number;
    is_active: boolean;
    metadata: CategoryMetadata;
    created_at: string;
    updated_at: string;
}

/**
 * Normalize a category from the Supabase response.
 * Convert snake_case to camelCase for frontend compatibility.
 */
function normalizeCategory(c: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string | null;
    parent: string | null;
    display_order: number;
    is_active: boolean;
    metadata: CategoryMetadata;
    created_at: string;
    updated_at: string;
}): Category {
    return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        parent: c.parent,
        display_order: c.display_order,
        is_active: c.is_active,
        metadata: c.metadata || {},
        created_at: c.created_at,
        updated_at: c.updated_at
    }
}

export async function GET(request: Request) {
    const supabase = createClient();

    // Parse query parameters
    const url = new URL(request.url);
    const parent = url.searchParams.get('parent');
    const active = url.searchParams.get('active');

    try {
        let query = supabase
            .from('categories')
            .select('*');

        // Apply filters
        if (parent) {
            query = query.eq('parent', parent);
        }

        if (active === 'true') {
            query = query.eq('is_active', true);
        }

        // Sort by display_order then name
        query = query.order('display_order', { ascending: true })
            .order('name', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        const categories = (data || []).map(normalizeCategory).map(c => ({
            _id: c.id, // Legacy support
            ...c,
            displayOrder: c.display_order,
            isActive: c.is_active
        }));

        return Response.json({ categories });

    } catch (error) {
        console.error('[GET /api/categories] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.slug) {
            return Response.json(
                { error: 'Missing required fields: name, slug' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: body.name,
                slug: body.slug,
                description: body.description || '',
                image: body.image || null,
                parent: body.parent || null,
                display_order: body.displayOrder || body.display_order || 0,
                is_active: body.isActive !== undefined ? body.isActive : (body.is_active !== false),
                metadata: body.metadata || {}
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }
        
        const normalized = normalizeCategory(data);

        return Response.json({
            _id: normalized.id, // Legacy support
            ...normalized,
            displayOrder: normalized.display_order,
            isActive: normalized.is_active
        }, { status: 201 });

    } catch (error) {
        console.error('[POST /api/categories] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}