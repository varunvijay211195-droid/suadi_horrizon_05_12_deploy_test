import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/notifications - Get notifications
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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Admin context
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' });

        if (unreadOnly === 'true') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, count: total, error: fetchError } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (fetchError) throw fetchError;

        // Get unread count separately
        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (countError) throw countError;

        // Map snake_case to camelCase for frontend compatibility if needed
        const mappedNotifications = notifications.map(n => ({
            ...n,
            isRead: n.is_read,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        }));

        return NextResponse.json({
            notifications: mappedNotifications,
            total,
            unreadCount: unreadCount || 0
        });
    } catch (error: unknown) {
        console.error('Error fetching admin notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
