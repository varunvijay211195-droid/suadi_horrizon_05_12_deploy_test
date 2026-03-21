import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createClient();

        // Find the current product to get its category
        const { data: currentProduct, error: fetchError } = await supabase
            .from('products')
            .select('category')
            .eq('id', id)
            .single();

        if (fetchError || !currentProduct) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Find similar products (same category, excluding current product)
        const { data: similarProducts, error: similarError } = await supabase
            .from('products')
            .select('*')
            .eq('category', currentProduct.category)
            .neq('id', id)
            .eq('in_stock', true)
            .limit(4);

        if (similarError) throw similarError;

        // Normalize for frontend compatibility
        const mappedProducts = (similarProducts || []).map(p => ({
            ...p,
            _id: p.id,
            originalPrice: p.original_price,
            inStock: p.in_stock,
            oemCode: p.oem_code
        }));

        return NextResponse.json(mappedProducts);
    } catch (error: any) {
        console.error('Error fetching similar products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch similar products', details: error.message },
            { status: 500 }
        );
    }
}
