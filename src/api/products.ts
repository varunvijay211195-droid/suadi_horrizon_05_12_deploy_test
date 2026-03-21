// Re-export from the new Supabase implementation for SSR performance
export { getProducts, getProductById, getRelatedProducts, type Product } from '@/lib/supabase/products';
