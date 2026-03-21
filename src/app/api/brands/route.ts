import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BrandMetadata {
    [key: string]: unknown;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    website: string | null;
    is_featured: boolean;
    is_active: boolean;
    metadata: BrandMetadata;
    created_at: string;
    updated_at: string;
}

/**
 * Normalize a brand from the Supabase response.
 * Convert snake_case to camelCase for frontend compatibility.
 */
function normalizeBrand(b: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    website: string | null;
    is_featured: boolean;
    is_active: boolean;
    metadata: BrandMetadata;
    created_at: string;
    updated_at: string;
}): Brand {
    return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        logo: b.logo,
        website: b.website,
        is_featured: b.is_featured,
        is_active: b.is_active,
        metadata: b.metadata,
        created_at: b.created_at,
        updated_at: b.updated_at
    };
}

export async function GET(request: NextRequest) {
    const supabase = createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');

    try {
        let query = supabase
            .from('brands')
            .select('*');

        // Apply filters
        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }
        if (isFeatured !== null) {
            query = query.eq('is_featured', isFeatured === 'true');
        }

        // Sort by name ascending
        query = query.order('name', { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const brands = (data || []).map(normalizeBrand).map(b => ({
            _id: b.id,
            ...b,
            isFeatured: b.is_featured,
            isActive: b.is_active
        }));

        return NextResponse.json({ brands });
    } catch (error) {
        console.error('[GET /api/brands] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = createClient();

    try {
        const body = await request.json();

        // Ensure id is provided or generated from slug
        const brandData = {
            id: body.id || body._id || body.slug,
            name: body.name,
            slug: body.slug,
            description: body.description,
            logo: body.logo,
            website: body.website,
            is_featured: body.isFeatured !== undefined ? body.isFeatured : false,
            is_active: body.isActive !== undefined ? body.isActive : true,
            metadata: body.metadata || {}
        };

        const { data, error } = await supabase
            .from('brands')
            .insert(brandData)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        const normalized = normalizeBrand(data);

        return NextResponse.json({
            _id: normalized.id,
            ...normalized,
            isFeatured: normalized.is_featured,
            isActive: normalized.is_active
        }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/brands] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
