import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/analytics/inventory - Get inventory analytics
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
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch all products (for analytics) - consider paging if this grows large
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, category, stock, price');

        if (productsError) {
            throw productsError;
        }

        const totalProducts = products?.length || 0;
        const totalStock = (products || []).reduce((sum, p) => sum + (p.stock ?? 0), 0);
        const totalValue = (products || []).reduce((sum, p) => sum + ((p.price ?? 0) * (p.stock ?? 0)), 0);
        const avgPrice = totalProducts ? totalValue / totalProducts : 0;

        // Low stock products
        const { data: lowStockProducts, error: lowStockError } = await supabase
            .from('products')
            .select('*')
            .lt('stock', 10)
            .order('stock', { ascending: true })
            .limit(10);

        if (lowStockError) {
            throw lowStockError;
        }

        // Out of stock count
        const { count: outOfStockCount = 0, error: outOfStockError } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('stock', 0);

        if (outOfStockError) {
            throw outOfStockError;
        }

        // Slow-moving products (low sales in last 30 days)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('items, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (ordersError) {
            throw ordersError;
        }

        const salesByProduct: Record<string, number> = {};
        (orders || []).forEach((order: any) => {
            const items = order.items || [];
            items.forEach((item: any) => {
                const productId = item.product;
                if (!productId) return;
                salesByProduct[productId] = (salesByProduct[productId] || 0) + (item.quantity || 0);
            });
        });

        const slowMovingProducts = Object.entries(salesByProduct)
            .filter(([, qty]) => qty < 5)
            .map(([productId, totalSold]) => {
                const product = (products || []).find((p: any) => p.id === productId);
                return {
                    productId,
                    name: product?.name || 'Unknown',
                    stock: product?.stock ?? 0,
                    totalSold
                };
            })
            .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
            .slice(0, 10);

        // Category distribution
        const categoryDistributionMap: Record<string, { count: number; totalStock: number }> = {};
        (products || []).forEach((product: any) => {
            const category = product.category || 'Unknown';
            const stock = product.stock ?? 0;
            if (!categoryDistributionMap[category]) {
                categoryDistributionMap[category] = { count: 0, totalStock: 0 };
            }
            categoryDistributionMap[category].count += 1;
            categoryDistributionMap[category].totalStock += stock;
        });

        const categoryDistribution = Object.entries(categoryDistributionMap)
            .map(([category, stats]) => ({ category, ...stats }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            summary: { totalValue, totalProducts, totalStock, avgPrice },
            outOfStockCount,
            lowStockProducts: lowStockProducts || [],
            slowMovingProducts,
            categoryDistribution
        });
    } catch (error: unknown) {
        console.error('Error fetching inventory analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory analytics' },
            { status: 500 }
        );
    }
}
