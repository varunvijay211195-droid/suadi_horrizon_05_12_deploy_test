// Description: Order management functions
// Endpoint: GET /api/orders, GET /api/orders/[id]
// Request: {}
// Response: Order data from Supabase

import api from './api';

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: Record<string, any>;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    products?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get('/api/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};