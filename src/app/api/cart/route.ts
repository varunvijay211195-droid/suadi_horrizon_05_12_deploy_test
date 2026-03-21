import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CartItem {
    id: string;
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    sku: string;
    type: 'product' | 'machinery';
}

export async function GET(request: NextRequest) {
    const supabase = createClient();

    try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            // Return empty cart for non-authenticated users (they use localStorage)
            return NextResponse.json({ items: [], total: 0, totalItems: 0 });
        }

        // Fetch cart items from database for authenticated users
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
        id,
        quantity,
        added_at,
        updated_at,
        products!inner (
          id,
          name,
          price,
          image,
          sku
        )
      `)
            .eq('user_id', user.id);

        if (cartError) {
            console.error('Error fetching cart items:', cartError);
            return NextResponse.json({ items: [], total: 0, totalItems: 0 });
        }

        // Transform the data to match frontend expectations
        const items: CartItem[] = (cartItems || []).map((item) => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products;

            return {
                id: item.id,
                product_id: product?.id || '',
                name: product?.name || 'Unknown Product',
                price: product?.price || 0,
                quantity: item.quantity,
                image: product?.image?.url || product?.image || '',
                sku: product?.sku || '',
                type: 'product' as const
            };
        });

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

        return NextResponse.json({
            items,
            total,
            totalItems,
            userId: user.id
        });

    } catch (error) {
        console.error('Error fetching cart:', error);
        return NextResponse.json({ items: [], total: 0, totalItems: 0 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = createClient();

    try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, quantity } = body;

        // Validate request
        if (!productId || !quantity || quantity < 1) {
            return NextResponse.json({ error: 'Invalid product ID or quantity' }, { status: 400 });
        }

        // Check if product exists
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, in_stock')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (!product.in_stock) {
            return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 });
        }

        // Add or update cart item
        const { data: cartItem, error: cartError } = await supabase
            .from('cart_items')
            .upsert({
                user_id: user.id,
                product_id: productId,
                quantity: quantity
            }, {
                onConflict: 'user_id,product_id'
            })
            .select()
            .single();

        if (cartError) {
            console.error('Error updating cart:', cartError);
            return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Item added to cart',
            cartItem
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const supabase = createClient();

    try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, quantity } = body;

        // Validate request
        if (!productId || quantity === undefined || quantity < 0) {
            return NextResponse.json({ error: 'Invalid product ID or quantity' }, { status: 400 });
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (deleteError) {
                console.error('Error removing item from cart:', deleteError);
                return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Item removed from cart'
            });
        }

        // Update cart item quantity
        const { data: cartItem, error: cartError } = await supabase
            .from('cart_items')
            .update({ quantity: quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .select()
            .single();

        if (cartError) {
            console.error('Error updating cart item:', cartError);
            return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Cart item updated',
            cartItem
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const supabase = createClient();

    try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (productId) {
            // Remove specific item from cart
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (deleteError) {
                console.error('Error removing item from cart:', deleteError);
                return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Item removed from cart'
            });
        } else {
            // Clear entire cart
            const { error: clearError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            if (clearError) {
                console.error('Error clearing cart:', clearError);
                return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Cart cleared'
            });
        }

    } catch (error) {
        console.error('Error clearing cart:', error);
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }
}