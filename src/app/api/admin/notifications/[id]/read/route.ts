import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// PATCH /api/admin/notifications/[id]/read - Mark notification as read
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { id } = await context.params;
        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Notification not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            ...notification,
            _id: notification.id,
            isRead: notification.is_read,
            createdAt: notification.created_at
        });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}
