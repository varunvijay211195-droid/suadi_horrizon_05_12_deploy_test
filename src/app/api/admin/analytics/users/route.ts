import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';

// GET /api/admin/analytics/users - Get user analytics
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
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const supabase = createClient();

        // Fetch users for analytics (using a reasonable limit if needed)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, created_at, role, last_login_at, is_active');

        if (usersError) {
            throw usersError;
        }

        const totalUsers = (users || []).length;
        const newUsers30Days = (users || []).filter((u: any) => u.created_at && new Date(u.created_at) >= thirtyDaysAgo).length;
        const activeUsers30Days = (users || []).filter((u: any) => u.last_login_at && new Date(u.last_login_at) >= thirtyDaysAgo).length;

        // New users trend over the last 90 days
        const newUsersTrendMap: Record<string, number> = {};
        (users || []).forEach((u: any) => {
            if (!u.created_at) return;
            const createdAt = new Date(u.created_at);
            if (createdAt < ninetyDaysAgo) return;
            const dateKey = createdAt.toISOString().slice(0, 10);
            newUsersTrendMap[dateKey] = (newUsersTrendMap[dateKey] || 0) + 1;
        });
        const newUsersTrend = Object.entries(newUsersTrendMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Users by role
        const usersByRoleMap: Record<string, number> = {};
        (users || []).forEach((u: any) => {
            const role = u.role || 'unknown';
            usersByRoleMap[role] = (usersByRoleMap[role] || 0) + 1;
        });
        const usersByRole = Object.entries(usersByRoleMap).map(([role, count]) => ({ role, count }));

        // Users by status (active/inactive)
        const usersByStatusMap: Record<string, number> = {};
        (users || []).forEach((u: any) => {
            const status = u.is_active === false ? 'inactive' : 'active';
            usersByStatusMap[status] = (usersByStatusMap[status] || 0) + 1;
        });
        const usersByStatus = Object.entries(usersByStatusMap).map(([status, count]) => ({ status, count }));

        return NextResponse.json({
            totalUsers,
            newUsers30Days,
            activeUsers30Days,
            growthRate: totalUsers > 0 ? ((newUsers30Days / totalUsers) * 100).toFixed(2) : '0',
            newUsersTrend,
            usersByRole,
            usersByStatus
        });
    } catch (error: unknown) {
        console.error('Error fetching user analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user analytics' },
            { status: 500 }
        );
    }
}
