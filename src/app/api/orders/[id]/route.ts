import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { sendOrderStatusUpdateEmail } from '@/lib/notifications/userNotifications';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = createClient();

        // Fetch order with items and products in one go if possible
        // In Supabase, we join order_items and then products
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('id', id)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { message: 'Order not found' },
                { status: 404 }
            );
        }

        // Map for frontend compatibility
        const mappedOrder = {
            ...order,
            _id: order.id,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            totalAmount: order.total_amount,
            shippingAddress: order.shipping_address,
            items: (order.order_items || []).map((item: Record<string, any>) => ({
                ...(item as Record<string, unknown>),
                product: (item as Record<string, any>).products
            }))
        };

        return NextResponse.json(mappedOrder);
    } catch (error: unknown) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { message: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Verify admin authentication for updates
    const authResult = await verifyAdminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, note } = body;
        const supabase = createClient();

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'flagged'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { message: 'Invalid status' },
                { status: 400 }
            );
        }

        const updateFields: Record<string, unknown> = {};
        if (status) updateFields.status = status;
        if (note) updateFields.admin_note = note;
        updateFields.updated_at = new Date().toISOString();

        const { data: order, error: updateError } = await supabase
            .from('orders')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();

        if (updateError || !order) {
            return NextResponse.json(
                { message: 'Order not found' },
                { status: 404 }
            );
        }

        // Send status update email to user if status was changed
        if (status) {
            try {
                // Fetch user data for email
                const { data: userData } = await supabase
                    .from('users')
                    .select('email, name')
                    .eq('id', order.user_id)
                    .single();

                if (userData?.email) {
                    // Non-blocking email send
                    sendOrderStatusUpdateEmail(
                        userData.email,
                        userData.name || 'Customer',
                        order.id.toString(),
                        status
                    ).catch(err => console.error('Background status update email failed:', err));
                }
            } catch (emailErr) {
                console.error('Failed to fetch user for status update email:', emailErr);
            }
        }

        return NextResponse.json({
            ...order,
            _id: order.id,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            totalAmount: order.total_amount,
            shippingAddress: order.shipping_address
        });
    } catch (error: unknown) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { message: 'Failed to update order' },
            { status: 500 }
        );
    }
}
