// Description: Cart management functions with Supabase integration
// Endpoint: GET/POST/PUT/DELETE /api/cart
// Request: Cart operations with database persistence for authenticated users

import { toast } from 'sonner';
import { addToServerCart, updateServerCartItem, removeFromServerCart, clearServerCart, getServerCart } from '@/lib/supabase/cart';

// Mock localStorage for SSR
const localStorageMock = {
  getItem: () => null,
  setItem: () => { },
  removeItem: () => { },
  clear: () => { },
};

const safeLocalStorage = typeof window !== 'undefined' ? window.localStorage : localStorageMock;

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  type: 'product' | 'machinery';
}

// Cart event emitter for cross-component updates
const CART_STORAGE_KEY = 'saudi_horizon_cart';

export const emitCartChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
};

export const getCart = async (): Promise<CartItem[]> => {
  try {
    // Try to get cart from server first (for authenticated users)
    const serverCart = await getServerCart();
    if (serverCart.items.length > 0) {
      return serverCart.items;
    }
  } catch (error) {
    console.warn('Failed to fetch server cart, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const cart = safeLocalStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

export const addToCart = async (item: CartItem): Promise<boolean> => {
  try {
    // Try to add to server cart first (for authenticated users)
    const serverSuccess = await addToServerCart(item.product_id, item.quantity);
    if (serverSuccess) {
      emitCartChange();
      return true;
    }
  } catch (error) {
    console.warn('Failed to add to server cart, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const cart = JSON.parse(safeLocalStorage.getItem(CART_STORAGE_KEY) || '[]');
    const existingItem = cart.find((i: CartItem) => i.product_id === item.product_id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    safeLocalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    emitCartChange();
    return true;
  } catch {
    return false;
  }
};

export const removeFromCart = async (itemId: string): Promise<void> => {
  try {
    // Try to remove from server cart first
    const serverSuccess = await removeFromServerCart(itemId);
    if (serverSuccess) {
      emitCartChange();
      return;
    }
  } catch (error) {
    console.warn('Failed to remove from server cart, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const cart = JSON.parse(safeLocalStorage.getItem(CART_STORAGE_KEY) || '[]');
    const filtered = cart.filter((i: CartItem) => i.product_id !== itemId);
    safeLocalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
    emitCartChange();
  } catch {
    // Ignore storage errors
  }
};

export const updateCartItem = async (itemId: string, quantity: number): Promise<void> => {
  try {
    // Try to update server cart first
    const serverSuccess = await updateServerCartItem(itemId, quantity);
    if (serverSuccess) {
      emitCartChange();
      return;
    }
  } catch (error) {
    console.warn('Failed to update server cart, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const cart = JSON.parse(safeLocalStorage.getItem(CART_STORAGE_KEY) || '[]');
    const item = cart.find((i: CartItem) => i.product_id === itemId);

    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        await removeFromCart(itemId);
      } else {
        safeLocalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        emitCartChange();
      }
    }
  } catch {
    // Ignore storage errors
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    // Try to clear server cart first
    const serverSuccess = await clearServerCart();
    if (serverSuccess) {
      emitCartChange();
      return;
    }
  } catch (error) {
    console.warn('Failed to clear server cart, falling back to localStorage:', error);
  }

  // Fallback to localStorage
  try {
    safeLocalStorage.removeItem(CART_STORAGE_KEY);
    emitCartChange();
  } catch {
    // Ignore storage errors
  }
};