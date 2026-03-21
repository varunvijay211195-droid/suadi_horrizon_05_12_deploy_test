import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Helper to get supabase admin client
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

// GET /api/users/[id] - Get a single user
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await context.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Format to match expected frontend structure
        const formattedUser = {
            _id: user.id,
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.is_active ?? true,
            profile: {
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                phone: user.phone || '',
                company: user.company || ''
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
        };

        return NextResponse.json({ user: formattedUser });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PATCH /api/users/[id] - Update user role, status, or profile
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Use admin client for role changes as it usually bypasses RLS
        const supabaseAdmin = getSupabaseAdmin();
        const { id } = await context.params;
        const body = await request.json();

        // Build update object
        const allowedFields: Record<string, unknown> = {};

        if (body.role !== undefined) {
            const validRoles = ['user', 'admin', 'manager', 'customer'];
            if (!validRoles.includes(body.role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }
            allowedFields.role = body.role;
        }

        if (body.isActive !== undefined) {
            allowedFields.is_active = Boolean(body.isActive);
        }

        if (body.name !== undefined) {
            const nameParts = String(body.name).trim().split(' ');
            allowedFields.first_name = nameParts[0] || '';
            allowedFields.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }

        if (Object.keys(allowedFields).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data: updatedUser, error } = await supabaseAdmin
            .from('users')
            .update(allowedFields)
            .eq('id', id)
            .select()
            .single();

        if (error || !updatedUser) {
            return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
        }

        const formattedUser = {
            _id: updatedUser.id,
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.is_active ?? true,
            profile: {
                name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim(),
                phone: updatedUser.phone || '',
                company: updatedUser.company || ''
            }
        };

        return NextResponse.json({ user: formattedUser, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { id } = await context.params;

        // Delete from auth layer. This is required; if public table has cascade delete, it will auto-delete there.
        // Even if not, we should delete from public table first/also to be safe.
        const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', id);
        
        if (dbError) {
             console.error('Error deleting user from database:', dbError);
             return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        
        if (authError) {
             // Let it pass if auth user doesn't exist, we just care it's deleted
             console.error('Error deleting user from auth:', authError);
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
