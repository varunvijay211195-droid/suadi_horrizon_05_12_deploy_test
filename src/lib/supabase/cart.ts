import { createClient } from '@/lib/supabase/client';

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

interface CartData {
    items: CartItem[];
    total: number;
    itemCount: number;
}

// Client-side cart functions that can sync with Supabase
export const addToServerCart = async (productId: string, quantity: number): Promise<boolean> => {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity
                }),
            });

            return response.ok;
        }

        return false; // Must be authenticated to use server cart
    } catch (error) {
        console.error('Failed to add item to server cart:', error);
        return false;
    }
};

export const updateServerCartItem = async (productId: string, quantity: number): Promise<boolean> => {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const response = await fetch('/api/cart', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity
                }),
            });

            return response.ok;
        }

        return false; // Must be authenticated to use server cart
    } catch (error) {
        console.error('Failed to update server cart item:', error);
        return false;
    }
};

export const removeFromServerCart = async (productId: string): Promise<boolean> => {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const response = await fetch(`/api/cart?productId=${productId}`, {
                method: 'DELETE',
            });

            return response.ok;
        }

        return false; // Must be authenticated to use server cart
    } catch (error) {
        console.error('Failed to remove item from server cart:', error);
        return false;
    }
};

export const getServerCart = async (): Promise<CartData> => {
    const supabase = createClient();

    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Failed to fetch server cart:', error);
    }

    // Fallback to empty cart
    return { items: [], total: 0, itemCount: 0 };
};

export const clearServerCart = async (): Promise<boolean> => {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
            });
            return response.ok;
        }

        return false; // Must be authenticated to use server cart
    } catch (error) {
        console.error('Failed to clear server cart:', error);
        return false;
    }
};

// Utility functions for cart calculations
export const calculateCartTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateItemCount = (items: CartItem[]): number => {
    return items.reduce((count, item) => count + item.quantity, 0);
};

export const validateCartItem = (item: Partial<CartItem>): boolean => {
    return !!(
        item.product_id &&
        item.name &&
        item.price &&
        item.quantity &&
        item.quantity > 0
    );
};