import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/analytics/sales - Get sales analytics
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
        const period = searchParams.get('period') || '30days';

        const daysMap: Record<string, number> = {
            '7days': 7,
            '30days': 30,
            '90days': 90,
            year: 365
        };
        const days = daysMap[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const supabase = createClient();

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('created_at, total_amount, items')
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        if (ordersError) {
            throw ordersError;
        }

        // Convert to normalized structure
        const normalizedOrders = (orders || []).map((o: any) => ({
            createdAt: new Date(o.created_at),
            totalAmount: o.total_amount || 0,
            items: o.items || []
        }));

        // Sales summary
        const totalOrders = normalizedOrders.length;
        const totalRevenue = normalizedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

        // Sales trend per day
        const salesTrendMap: Record<string, { sales: number; orders: number }> = {};
        normalizedOrders.forEach((order) => {
            const dateKey = order.createdAt.toISOString().slice(0, 10);
            if (!salesTrendMap[dateKey]) {
                salesTrendMap[dateKey] = { sales: 0, orders: 0 };
            }
            salesTrendMap[dateKey].sales += order.totalAmount;
            salesTrendMap[dateKey].orders += 1;
        });

        const salesTrend = Object.entries(salesTrendMap)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Top products
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
        normalizedOrders.forEach((order) => {
            order.items.forEach((item: any) => {
                const id = item.product;
                if (!id) return;
                if (!productSales[id]) {
                    productSales[id] = { name: item.name || 'Unknown', quantity: 0, revenue: 0 };
                }
                productSales[id].quantity += item.quantity || 0;
                productSales[id].revenue += (item.quantity || 0) * (item.price || 0);
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([productId, stats]) => ({ productId, ...stats }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Category breakdown
        const productIds = topProducts.map((p) => p.productId);
        let categoryBreakdown: Array<{ category: string; revenue: number; orders: number }> = [];

        if (productIds.length) {
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, category')
                .in('id', productIds);

            if (productsError) {
                throw productsError;
            }

            const categoryRevenue: Record<string, { revenue: number; orders: number }> = {};

            topProducts.forEach((p) => {
                const product = (products || []).find((prod: any) => prod.id === p.productId);
                const category = product?.category || 'Uncategorized';
                if (!categoryRevenue[category]) {
                    categoryRevenue[category] = { revenue: 0, orders: 0 };
                }
                categoryRevenue[category].revenue += p.revenue;
                categoryRevenue[category].orders += 1;
            });

            categoryBreakdown = Object.entries(categoryRevenue)
                .map(([category, stats]) => ({ category, ...stats }))
                .sort((a, b) => b.revenue - a.revenue);
        }

        return NextResponse.json({
            period,
            summary: { totalRevenue, totalOrders, avgOrderValue },
            salesTrend,
            topProducts,
            categoryBreakdown
        });
    } catch (error: unknown) {
        console.error('Error fetching sales analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sales analytics' },
            { status: 500 }
        );
    }
}
