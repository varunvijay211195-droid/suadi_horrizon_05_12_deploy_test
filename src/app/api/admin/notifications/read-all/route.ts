import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// PATCH /api/admin/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
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

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;

        return NextResponse.json({
            message: 'All notifications marked as read'
        });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark all notifications as read' },
            { status: 500 }
        );
    }
}
