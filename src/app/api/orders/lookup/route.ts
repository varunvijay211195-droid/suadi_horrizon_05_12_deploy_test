import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, email, phone } = body;

        if (!orderId || (!email && !phone)) {
            return NextResponse.json(
                { error: 'Order ID and email or phone are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();
        let order;

        // Try to find by order ID first (UUID)
        const isUuid = orderId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
        
        if (isUuid) {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            if (data) order = data;
        }

        // If not found by ID, try searching by contact info
        if (!order) {
            let query = supabase.from('orders').select('*');
            
            if (email) {
                query = query.eq('shipping_address->>email', email);
            } else if (phone) {
                query = query.eq('shipping_address->>phone', phone);
            }

            const { data: contactOrders } = await query
                .order('created_at', { ascending: false })
                .limit(10);

            if (contactOrders && contactOrders.length > 0) {
                order = contactOrders[0];
            }
        }

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found. Please check your order ID and contact information.' },
                { status: 404 }
            );
        }

        // Verify contact info matches
        const shippingAddress = order.shipping_address || {};
        const hasValidContact =
            (email && shippingAddress.email === email) ||
            (phone && shippingAddress.phone === phone);

        if (!hasValidContact) {
            return NextResponse.json(
                { error: 'Order not found. Please check your order ID and contact information.' },
                { status: 404 }
            );
        }

        // Return order details
        return NextResponse.json({
            ...order,
            _id: order.id,
            orderNumber: `SH-${order.id.toString().slice(-8).toUpperCase()}`,
            status: order.status,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            totalAmount: order.total_amount,
            shippingAddress: order.shipping_address,
        });
    } catch (error) {
        console.error('Order lookup error:', error);
        return NextResponse.json(
            { error: 'Failed to lookup order. Please try again later.' },
            { status: 500 }
        );
    }
}
