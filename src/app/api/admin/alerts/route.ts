import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/alerts - Get all alert counts
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
        const supabase = createClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [lowStockRes, pendingOrdersRes, newUsersRes] = await Promise.all([
            supabase
                .from('products')
                .select('id', { count: 'exact' })
                .lt('stock', 10),
            supabase
                .from('orders')
                .select('id', { count: 'exact' })
                .eq('status', 'pending'),
            supabase
                .from('users')
                .select('id', { count: 'exact' })
                .gte('created_at', today.toISOString()),
        ]);

        if (lowStockRes.error || pendingOrdersRes.error || newUsersRes.error) {
            console.error('Supabase error:', lowStockRes.error || pendingOrdersRes.error || newUsersRes.error);
            return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
        }

        const lowStockCount = lowStockRes.count || 0;
        const pendingOrders = pendingOrdersRes.count || 0;
        const newUsersToday = newUsersRes.count || 0;

        return NextResponse.json({
            lowStockCount,
            pendingOrders,
            newUsersToday,
            totalAlerts: lowStockCount + pendingOrders
        });
    } catch (error: unknown) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch alerts' },
            { status: 500 }
        );
    }
}
