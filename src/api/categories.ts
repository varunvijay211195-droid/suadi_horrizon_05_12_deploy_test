// Description: Get all product categories
// Endpoint: GET /api/categories
// Request: {}
// Response: { categories: Array<Category> }

import api from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const getCategories = async (): Promise<{ categories: Category[] }> => {
  try {
    const response = await api.get('/api/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array as fallback
    return { categories: [] };
  }
};