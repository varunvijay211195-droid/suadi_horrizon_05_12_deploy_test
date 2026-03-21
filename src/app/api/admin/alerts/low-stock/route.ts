import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/alerts/low-stock - Get products with low stock
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
        const { searchParams } = new URL(request.url);
        const threshold = parseInt(searchParams.get('threshold') || '10');

        const supabase = createClient();

        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .lt('stock', threshold)
            .order('stock', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error fetching low stock products:', error);
            return NextResponse.json({ error: 'Failed to fetch low stock alerts' }, { status: 500 });
        }

        return NextResponse.json({
            count: products?.length ?? 0,
            threshold,
            products: products || []
        });
    } catch (error: unknown) {
        console.error('Error fetching low stock alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch low stock alerts' },
            { status: 500 }
        );
    }
}
