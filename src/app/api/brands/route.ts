import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/brands
 * Returns a deduplicated, sorted list of all brands from the products table.
 */
export async function GET() {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .select('brand')
            .eq('in_stock', true)
            .not('brand', 'is', null);

        if (error) {
            console.error('[GET /api/brands] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const brands = [...new Set((data || []).map(p => p.brand).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));

        return NextResponse.json({ brands });
    } catch (err) {
        console.error('[GET /api/brands] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
