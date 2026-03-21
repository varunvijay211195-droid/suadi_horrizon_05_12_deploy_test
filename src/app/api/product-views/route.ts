import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/middleware';

// POST - Track a product view
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();

        // Get optional authentication
        const auth = await verifyAuth(req);

        const body = await req.json();
        const {
            productId,
            productName,
            category,
            brand,
            referrer,
            duration,
            deviceType,
            sessionId
        } = body;

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }

        // Get session ID from body or headers
        const sessionIdToUse = sessionId || req.headers.get('x-session-id') || `session_${Date.now()}`;

        const { data: productView, error } = await supabase
            .from('product_views')
            .insert({
                user_id: auth?.sub || null,
                session_id: sessionIdToUse,
                product_id: productId,
                product_name: productName,
                category,
                brand,
                referrer,
                duration,
                device_type: deviceType || 'desktop'
            })
            .select()
            .single();

        if (error) {
            console.error('Error tracking product view:', error);
            return NextResponse.json(
                { error: 'Failed to track product view' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, viewId: productView.id },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error tracking product view:', error);
        return NextResponse.json(
            { error: 'Failed to track product view' },
            { status: 500 }
        );
    }
}

// GET - Get product view analytics (admin only)
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);

        // Only admins can view analytics
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient();

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '7'; // days
        const productId = searchParams.get('productId');
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        const startDateISO = startDate.toISOString();

        // Build base query
        let baseQuery = supabase
            .from('product_views')
            .select('*')
            .gte('viewed_at', startDateISO);

        if (productId) {
            baseQuery = baseQuery.eq('product_id', productId);
        }
        if (category) {
            baseQuery = baseQuery.eq('category', category);
        }
        if (brand) {
            baseQuery = baseQuery.eq('brand', brand);
        }

        // Get all matching records for analytics
        const { data: allViews } = await baseQuery.select('*');
        const totalViews = allViews?.length || 0;

        // Get unique viewers (distinct session_ids)
        const uniqueViewers = new Set(allViews?.map(v => v.session_id) || []).size;

        // Get views by product (top 10)
        const { data: productData } = await supabase
            .from('product_views')
            .select('product_id, product_name')
            .gte('viewed_at', startDateISO);

        const viewsByProduct = (() => {
            if (!productData) return [];
            const productCounts: Record<string, { id: string; name: string; count: number }> = {};

            productData.forEach(view => {
                const key = view.product_id;
                if (!productCounts[key]) {
                    productCounts[key] = { id: key, name: view.product_name || 'Unknown', count: 0 };
                }
                productCounts[key].count++;
            });

            return Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        })();

        // Get views by category
        const { data: categoryData, error: categoryError } = await supabase
            .from('product_views')
            .select('category')
            .gte('viewed_at', startDateISO)
            .not('category', 'is', null);

        const viewsByCategory: Record<string, number> = {};
        categoryData?.forEach(view => {
            if (view.category) {
                viewsByCategory[view.category] = (viewsByCategory[view.category] || 0) + 1;
            }
        });

        const categoryArray = Object.entries(viewsByCategory)
            .map(([category, count]) => ({ _id: category, count }))
            .sort((a, b) => b.count - a.count);

        // Get views by brand
        const { data: brandData, error: brandError } = await supabase
            .from('product_views')
            .select('brand')
            .gte('viewed_at', startDateISO)
            .not('brand', 'is', null);

        const viewsByBrand: Record<string, number> = {};
        brandData?.forEach(view => {
            if (view.brand) {
                viewsByBrand[view.brand] = (viewsByBrand[view.brand] || 0) + 1;
            }
        });

        const brandArray = Object.entries(viewsByBrand)
            .map(([brand, count]) => ({ _id: brand, count }))
            .sort((a, b) => b.count - a.count);

        // Get average duration
        const { data: durationData, error: durationError } = await supabase
            .from('product_views')
            .select('duration')
            .gte('viewed_at', startDateISO)
            .not('duration', 'is', null);

        const avgDuration = durationData && durationData.length > 0
            ? durationData.reduce((sum, item) => sum + (item.duration || 0), 0) / durationData.length
            : 0;

        return NextResponse.json({
            totalViews: totalViews || 0,
            uniqueViewers,
            viewsByProduct,
            viewsByCategory: categoryArray,
            viewsByBrand: brandArray,
            avgDuration,
            period: parseInt(period)
        });
    } catch (error: unknown) {
        console.error('Error fetching product view analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
