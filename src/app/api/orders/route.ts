import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyNewOrder } from '@/lib/notifications/adminNotifications';
import { sendOrderConfirmationEmail } from '@/lib/notifications/userNotifications';

interface OrderItem {
    product: string;
    quantity: number;
    price: number;
    name?: string;
}

export async function POST(request: NextRequest) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { userId, items, totalAmount, shippingAddress } = body;

        // Validation
        if (!userId || !items || !totalAmount || !shippingAddress) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                total_amount: totalAmount,
                shipping_address: shippingAddress,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
        }

        // Create order items
        const orderItems = items.map((item: OrderItem) => ({
            order_id: order.id,
            product: item.product,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items creation error:', itemsError);
            // Clean up the order if items failed
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ message: 'Failed to create order items' }, { status: 500 });
        }

        // ─── NOTIFICATIONS ───────────────────────────────────────────────

        // Fetch order data with items for email
        const { data: orderWithItems, error: fetchError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('id', order.id)
            .single();

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (orderWithItems && (shippingAddress?.email || user?.email)) {
            const customerEmail = shippingAddress?.email || user?.email;
            const customerName = shippingAddress?.name || user?.profile?.name || 'Customer';

            // Send Confirmation Email to User (Non-blocking)
            sendOrderConfirmationEmail(customerEmail, customerName, orderWithItems)
                .catch(err => console.error('Order confirmation email failed:', err));
        }

        // Create admin notification for new order (Non-blocking)
        notifyNewOrder(
            order.id.toString(),
            totalAmount,
            shippingAddress?.email || user?.email
        ).catch(err => console.error('Admin order notification failed:', err));

        // ─── USER PROFILE UPDATE FOR MARKETING ───────────────────────────────

        // Update user's purchase history and segment
        if (user && !userError) {
            // Get product details for purchase history
            const productIds = items.map((item: OrderItem) => item.product);
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, name, category, brand')
                .in('id', productIds);

            if (!productsError && products) {
                const productMap = new Map(products.map(p => [p.id, p]));

                // Build purchase history items
                const purchaseItems = items.map((item: OrderItem) => {
                    const product = productMap.get(item.product);
                    return {
                        user_id: userId,
                        order_id: order.id,
                        product_id: item.product,
                        product_name: item.name || product?.name || 'Product',
                        category: product?.category || '',
                        brand: product?.brand || '',
                        amount: item.price * item.quantity
                    };
                });

                // Insert purchase history
                const { error: historyError } = await supabase
                    .from('user_purchase_history')
                    .insert(purchaseItems);

                if (historyError) {
                    console.warn('Failed to update purchase history:', historyError);
                }

                // Update user marketing fields
                const newTotalSpent = (user.total_spent || 0) + totalAmount;
                const newTotalOrders = (user.total_orders || 0) + 1;

                // Update preferred categories and brands
                const categories = new Set(user.preferred_categories || []);
                const brands = new Set(user.preferred_brands || []);

                products.forEach((p) => {
                    if (p.category) categories.add(p.category);
                    if (p.brand) brands.add(p.brand);
                });

                // Determine segment
                let segment = 'new';
                if (newTotalSpent > 50000) {
                    segment = 'vip';
                } else if (user.profile?.company) {
                    segment = 'b2b';
                } else if (newTotalOrders > 0) {
                    segment = 'regular';
                }

                // Update user profile
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        total_spent: newTotalSpent,
                        total_orders: newTotalOrders,
                        preferred_categories: Array.from(categories),
                        preferred_brands: Array.from(brands),
                        segment: segment
                    })
                    .eq('id', userId);

                if (updateError) {
                    console.warn('Failed to update user profile:', updateError);
                }
            }
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { message: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const supabase = createClient();

    try {
        const { searchParams } = new URL(request.url);
        let userId = searchParams.get('userId');
        const admin = searchParams.get('admin');

        // If admin parameter is set, return all orders (for admin panel)
        if (admin === 'true' || admin === '1') {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users!inner(email, profile),
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching admin orders:', error);
                return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 });
            }

            return NextResponse.json({ orders });
        }

        // If no userId provided, try to extract from auth token
        if (!userId) {
            const { verifyAuth } = await import('@/lib/auth/middleware');
            const user = await verifyAuth(request);
            if (user) {
                userId = user.sub;
            }
        }

        // Regular user order fetch requires userId
        if (!userId) {
            return NextResponse.json(
                { message: 'Authentication required to view orders' },
                { status: 401 }
            );
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (*)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user orders:', error);
            return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 });
        }

        return NextResponse.json(orders);
    } catch (error: unknown) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { message: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
