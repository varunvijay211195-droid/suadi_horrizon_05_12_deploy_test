import { createClient } from '@/lib/supabase/client';

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
    originalPrice?: number;
    image: ProductImage | null;
    gallery: ProductImage[];
    documents: ProductDocument[];
    description: string;
    specs: ProductSpecs;
    compatibility: string[];
    in_stock: boolean;
    inStock: boolean;
    stock: number;
    rating: number;
    reviews: number;
    oem_code: string;
    oemCode?: string;
    featured: boolean;
    created_at: string;
    updated_at: string;
    createdAt?: string;
    updatedAt?: string;
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
        originalPrice: p.original_price,
        image: p.image,
        gallery: p.gallery || [],
        documents: p.documents || [],
        description: p.description,
        specs: p.specs,
        compatibility: p.compatibility || [],
        in_stock: p.in_stock,
        inStock: p.in_stock,
        stock: p.stock,
        rating: p.rating,
        reviews: p.reviews,
        oem_code: p.oem_code,
        oemCode: p.oem_code,
        featured: p.featured,
        created_at: p.created_at,
        updated_at: p.updated_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

export const getProducts = async (filters?: {
    category?: string;
    brand?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ products: Product[]; total: number }> => {
    const supabase = createClient();

    try {
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('in_stock', true);

        // Apply filters
        if (filters?.category) {
            query = query.eq('category', filters.category);
        }

        if (filters?.brand) {
            query = query.eq('brand', filters.brand);
        }

        if (filters?.priceMin) {
            query = query.gte('price', filters.priceMin);
        }

        if (filters?.priceMax) {
            query = query.lte('price', filters.priceMax);
        }

        if (filters?.search) {
            query = query.or(
                `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
            );
        }

        // Apply pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Sort by created_at descending
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to fetch products: ${error.message}`);
        }

        const products = (data || []).map(normalizeProduct);

        return { products, total: count || 0 };
    } catch (error) {
        console.error('[getProducts] Error:', error);
        throw error;
    }
};

export const getProductById = async (id: string): Promise<Product> => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Failed to fetch product: ${error.message}`);
        }

        return normalizeProduct(data);
    } catch (error) {
        console.error('[getProductById] Error:', error);
        throw error;
    }
};

export const getRelatedProducts = async (productId: string): Promise<Product[]> => {
    const supabase = createClient();

    try {
        // Get the product first to find similar products
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError) {
            console.error('Error fetching product:', productError);
            return [];
        }

        // Find products in the same category, excluding the current product
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', productId)
            .eq('in_stock', true)
            .limit(4);

        if (error) {
            console.error('Error fetching related products:', error);
            return [];
        }

        return (data || []).map(normalizeProduct);
    } catch (error) {
        console.error('[getRelatedProducts] Error:', error);
        return [];
    }
};