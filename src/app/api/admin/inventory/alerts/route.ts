import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/inventory/alerts - Get stock alerts
export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const supabase = createClient();

        // Critical alerts (out of stock)
        const { data: criticalAlerts, error: criticalError } = await supabase
            .from('products')
            .select('name, sku, stock, price, category')
            .eq('stock', 0)
            .order('updated_at', { ascending: false });

        if (criticalError) {
            throw criticalError;
        }

        // Warning alerts (low stock - less than 10 units)
        const { data: warningAlerts, error: warningError } = await supabase
            .from('products')
            .select('name, sku, stock, price, category')
            .gt('stock', 0)
            .lt('stock', 10)
            .order('stock', { ascending: true });

        if (warningError) {
            throw warningError;
        }

        // Calculate alert statistics
        const { data: allProducts, error: allError } = await supabase
            .from('products')
            .select('stock');

        if (allError) {
            throw allError;
        }

        const alertStats = (allProducts || []).reduce(
            (acc, p: any) => {
                const stock = p.stock ?? 0;
                if (stock === 0) acc.totalCritical += 1;
                if (stock > 0 && stock < 10) acc.totalWarning += 1;
                if (stock < 10) acc.totalLowStock += 1;
                return acc;
            },
            { totalCritical: 0, totalWarning: 0, totalLowStock: 0 }
        );

        return NextResponse.json({
            critical: criticalAlerts || [],
            warning: warningAlerts || [],
            stats: alertStats
        });
    } catch (error: unknown) {
        console.error('Error fetching inventory alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory alerts' },
            { status: 500 }
        );
    }
}

// POST /api/admin/inventory/alerts/notify - Send stock alert notifications
export async function POST(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    try {
        const { type } = await request.json();
        const supabase = createClient();

        // Get alerts based on type
        let query = supabase.from('products').select('name, sku, stock, price, category');
        if (type === 'critical') {
            query = query.eq('stock', 0);
        } else if (type === 'warning') {
            query = query.gt('stock', 0).lt('stock', 10);
        } else {
            query = query.lt('stock', 10);
        }

        const { data: alerts, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            message: 'Stock alerts processed',
            alertsCount: (alerts || []).length,
            alerts: alerts || []
        });
    } catch (error: unknown) {
        console.error('Error processing stock alerts:', error);
        return NextResponse.json(
            { error: 'Failed to process stock alerts' },
            { status: 500 }
        );
    }
}