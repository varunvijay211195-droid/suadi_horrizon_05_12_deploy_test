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

interface Product {
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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = createClient();
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return Response.json({ error: 'Product not found' }, { status: 404 });
            }
            console.error('Supabase error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return Response.json({ error: 'Product not found' }, { status: 404 });
        }

        return Response.json(normalizeProduct(data));

    } catch (error) {
        console.error('[GET /api/products/[id]] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const supabase = createClient();
    const productId = resolvedParams.id;

    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('products')
            .update({
                name: body.name,
                sku: body.sku,
                brand: body.brand,
                category: body.category,
                subcategory: body.subcategory,
                price: body.price,
                original_price: body.original_price,
                image: body.image,
                gallery: body.gallery,
                documents: body.documents,
                description: body.description,
                specs: body.specs,
                compatibility: body.compatibility,
                in_stock: body.in_stock,
                stock: body.stock,
                rating: body.rating,
                reviews: body.reviews,
                oem_code: body.oem_code,
                featured: body.featured
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json(normalizeProduct(data));

    } catch (error) {
        console.error('[PUT /api/products/[id]] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const supabase = createClient();
    const productId = resolvedParams.id;

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Supabase delete error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('[DELETE /api/products/[id]] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}