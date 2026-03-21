import { createClient } from '@/lib/supabase/server'

interface ProductImage {
    url: string;
    alt?: string;
    public_id?: string;
}

interface ProductDocument {
    url: string;
    name: string;
    type: string;
}

interface ProductSpecs {
    [key: string]: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    brand: string;
    category: string;
    subcategory: string | null;
    price: number;
    original_price?: number;
    image: ProductImage | null;
    gallery: ProductImage[];
    documents: ProductDocument[];
    description: string;
    specs: ProductSpecs;
    compatibility: string[];
    in_stock: boolean;
    stock: number;
    rating: number;
    reviews: number;
    oem_code: string;
    featured: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Normalize a product from the Supabase response.
 * Convert snake_case to camelCase for frontend compatibility.
 */
function normalizeProduct(p: {
    id: string;
    name: string;
    sku: string;
    brand: string;
    category: string;
    subcategory: string | null;
    price: number;
    original_price?: number;
    image: ProductImage | null;
    gallery: ProductImage[];
    documents: ProductDocument[];
    description: string;
    specs: ProductSpecs;
    compatibility: string[];
    in_stock: boolean;
    stock: number;
    rating: number;
    reviews: number;
    oem_code: string;
    featured: boolean;
    created_at: string;
    updated_at: string;
}): Product {
    return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory,
        price: p.price,
        original_price: p.original_price,
        image: p.image,
        gallery: p.gallery || [],
        documents: p.documents || [],
        description: p.description,
        specs: p.specs,
        compatibility: p.compatibility || [],
        in_stock: p.in_stock,
        stock: p.stock,
        rating: p.rating,
        reviews: p.reviews,
        oem_code: p.oem_code,
        featured: p.featured,
        created_at: p.created_at,
        updated_at: p.updated_at
    }
}

export async function GET(request: Request) {
    const supabase = createClient();

    // Parse query parameters
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const brand = url.searchParams.get('brand');
    const priceMin = url.searchParams.get('priceMin');
    const priceMax = url.searchParams.get('priceMax');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    try {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('in_stock', true);

        // Apply filters
        if (category) {
            query = query.eq('category', category);
        }

        if (brand) {
            query = query.eq('brand', brand);
        }

        if (priceMin) {
            query = query.gte('price', parseFloat(priceMin));
        }

        if (priceMax) {
            query = query.lte('price', parseFloat(priceMax));
        }

        if (search) {
            query = query.or(
                `name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Sort by created_at descending
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        const products = (data || []).map(normalizeProduct).map(p => ({
            _id: p.id, // Legacy compatibility
            ...p,
            originalPrice: p.original_price,
            inStock: p.in_stock,
            oemCode: p.oem_code
        }));

        return Response.json({
            products,
            total: count || 0,
            page,
            limit
        });

    } catch (error) {
        console.error('[GET /api/products] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.sku || !body.brand || !body.category) {
            return Response.json(
                { error: 'Missing required fields: name, sku, brand, category' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('products')
            .insert({
                id: body.id || body._id || `prod-${Date.now()}`,
                name: body.name,
                sku: body.sku,
                brand: body.brand,
                category: body.category,
                subcategory: body.subcategory || null,
                price: body.price || 0,
                original_price: body.originalPrice || body.original_price,
                image: body.image || null,
                gallery: body.gallery || [],
                documents: body.documents || [],
                description: body.description || '',
                specs: body.specs || {},
                compatibility: body.compatibility || [],
                in_stock: body.inStock !== undefined ? body.inStock : (body.in_stock !== false),
                stock: body.stock || 0,
                rating: body.rating || 0,
                reviews: body.reviews || 0,
                oem_code: body.oemCode || body.oem_code || '',
                featured: body.featured || false
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        const normalized = normalizeProduct(data);

        return Response.json({
            _id: normalized.id, // Legacy compatibility
            ...normalized,
            originalPrice: normalized.original_price,
            inStock: normalized.in_stock,
            oemCode: normalized.oem_code
        }, { status: 201 });

    } catch (error) {
        console.error('[POST /api/products] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}