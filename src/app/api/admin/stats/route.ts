import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

export async function GET(request: NextRequest) {
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Date boundaries
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoStr = sixMonthsAgo.toISOString();

        // 1. Basic Counts
        const [
            { count: totalUsers },
            { count: totalProducts },
            { count: totalOrders },
            { count: newUsersThisMonth },
            { count: lowStockCount }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', startOfThisMonth),
            supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock', 5)
        ]);

        // 2. Revenue & Order History for Analysis
        // Fetch orders from last 2 months for comparisons and last 6 months for chart
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, status, created_at')
            .gte('created_at', sixMonthsAgoStr);

        if (ordersError) throw ordersError;

        const validOrders = ordersData.filter(o => o.status !== 'cancelled');
        const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Calculate this month vs last month revenue/counts
        const thisMonthOrders = validOrders.filter(o => o.created_at >= startOfThisMonth);
        const lastMonthOrders = validOrders.filter(o => o.created_at >= startOfLastMonth && o.created_at < startOfThisMonth);

        const thisRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const lastRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const thisOrdersCount = thisMonthOrders.length;
        const lastOrdersCount = lastMonthOrders.length;

        const pct = (curr: number, prev: number): number | null =>
            prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

        const revenueChange = pct(thisRevenue, lastRevenue);
        const ordersChange = pct(thisOrdersCount, lastOrdersCount);

        // Monthly revenue (last 6 months)
        const monthlyRevenueMap = new Map();
        validOrders.forEach(o => {
            const month = o.created_at.substring(0, 7); // YYYY-MM
            const current = monthlyRevenueMap.get(month) || { sales: 0, count: 0 };
            monthlyRevenueMap.set(month, {
                sales: current.sales + (o.total_amount || 0),
                count: current.count + 1
            });
        });

        const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
            .map(([month, data]) => ({ _id: month, ...data }))
            .sort((a, b) => a._id.localeCompare(b._id));

        // Order status breakdown
        const statusMap = new Map();
        ordersData.forEach(o => {
            statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
        });
        const orderStatusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({ _id: status, count }));

        // 3. Recent Activities (Unified Feed Data)
        const [
            { data: recentOrdersData },
            { data: recentProductsData },
            { data: recentUsersData },
            { data: recentQuotesData },
            { data: recentBannersData }
        ] = await Promise.all([
            supabase.from('orders').select('id, total_amount, status, created_at, users(email, profile)').order('created_at', { ascending: false }).limit(6),
            supabase.from('products').select('id, name, category, price, created_at').order('created_at', { ascending: false }).limit(5),
            supabase.from('users').select('id, email, profile, created_at').order('created_at', { ascending: false }).limit(4),
            supabase.from('quote_requests').select('id, company_name, contact_person, status, created_at').order('created_at', { ascending: false }).limit(4),
            supabase.from('banners').select('id, title, position, is_active, created_at').order('created_at', { ascending: false }).limit(6)
        ]);

        interface Activity {
            type: string;
            id: string;
            title: string;
            subtitle: string;
            meta: string;
            status: string | null;
            createdAt: string;
            href: string;
        }

        const activities: Activity[] = [
            ...(recentOrdersData || []).map((o: any) => {
                const user = Array.isArray(o.users) ? o.users[0] : o.users;
                return {
                    type: 'order',
                    id: o.id,
                    title: `New order placed`,
                    subtitle: user?.email || 'Guest',
                    meta: `SAR ${o.total_amount?.toLocaleString()}`,
                    status: o.status,
                    createdAt: o.created_at,
                    href: '/admin/orders',
                };
            }),
            ...(recentProductsData || []).map((p: any) => ({
                type: 'product',
                id: p.id,
                title: `Product added`,
                subtitle: p.name,
                meta: p.category,
                status: null,
                createdAt: p.created_at,
                href: '/admin/products',
            })),
            ...(recentUsersData || []).map((u: any) => ({
                type: 'user',
                id: u.id,
                title: `New user registered`,
                subtitle: u.email,
                meta: (u.profile as any)?.name || '',
                status: null,
                createdAt: u.created_at,
                href: '/admin/users',
            })),
            ...(recentQuotesData || []).map((q: any) => ({
                type: 'quote',
                id: q.id,
                title: `Quote request received`,
                subtitle: q.company_name,
                meta: q.contact_person,
                status: q.status,
                createdAt: q.created_at,
                href: '/admin/quotes',
            })),
            ...(recentBannersData || []).map((b: any) => ({
                type: 'banner',
                id: b.id,
                title: `Banner ${b.is_active ? 'activated' : 'created'}`,
                subtitle: b.title,
                meta: b.position,
                status: b.is_active ? 'active' : 'inactive',
                createdAt: b.created_at,
                href: '/admin/banners',
            })),
        ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12);

        // Top products - Placeholder as it requires complex order_items join or json parsing
        // For now, we will return an empty array or a simple list if we had sales data per product
        const topProducts: any[] = []; 

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            totalProducts: totalProducts || 0,
            totalOrders: totalOrders || 0,
            totalRevenue,
            monthlyRevenue,
            recentOrders: (recentOrdersData || []).map((o: any) => {
                const user = Array.isArray(o.users) ? o.users[0] : o.users;
                return {
                    _id: o.id,
                    user: { email: user?.email, name: (user?.profile as any)?.name },
                    totalAmount: o.total_amount,
                    status: o.status,
                    createdAt: o.created_at
                };
            }),
            topProducts,
            orderStatusBreakdown,
            activities,
            activeBanners: (recentBannersData || []).filter((b: any) => b.is_active).map((b: any) => ({
                _id: b.id,
                title: b.title,
                position: b.position,
                isActive: b.is_active,
                createdAt: b.created_at
            })),
            newUsersThisMonth: newUsersThisMonth || 0,
            lowStockCount: lowStockCount || 0,
            revenueChange,
            ordersChange,
        });
    } catch (error: unknown) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
    }
}
