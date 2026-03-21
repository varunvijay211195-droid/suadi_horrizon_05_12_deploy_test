'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RecentlyViewedProduct {
  productId: string;
  name: string;
  price: number;
  images: string[];
  viewedAt: string;
}

export default function RecentlyViewedProducts() {
  const [viewedProducts, setViewedProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchRecentlyViewedProducts();
  }, [user]);

  const fetchRecentlyViewedProducts = async () => {
    try {
      setLoading(true);
      setHasError(false);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/notifications/recently-viewed', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch viewed products');
      }

      const data = await response.json();
      setViewedProducts(data || []);
    } catch (error) {
      console.error('Error fetching viewed products:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const trackViewedProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/notifications/recently-viewed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        console.error('Failed to track viewed product');
      }
    } catch (error) {
      console.error('Error tracking viewed product:', error);
    }
  };

  // Track product view when on a product page
  useEffect(() => {
    if (!user) return;

    // Check if we are on a product page like /products/[id]
    const match = pathname.match(/\/products\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      trackViewedProduct(match[1]);
    }
  }, [user, pathname]);

  if (!user || viewedProducts.length === 0) return null;

  if (loading) {
    return (
      <div className="p-4 bg-navy/50 border border-white/10 rounded-xl animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-12 bg-white/10 rounded" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-navy/40 border border-white/10 rounded-2xl backdrop-blur-md">
      <h3 className="text-sm font-bold text-white/50 uppercase tracking-[0.2em] mb-6">
        Recently Viewed
      </h3>
      <div className="space-y-4">
        {viewedProducts.slice(0, 5).map((product) => (
          <div
            key={product.productId}
            className="flex items-center space-x-4 p-2 rounded-xl hover:bg-white/5 transition-all duration-300 group cursor-pointer"
            onClick={() => router.push(`/products/${product.productId}`)}
          >
            <div className="w-14 h-14 bg-white/5 rounded-lg overflow-hidden border border-white/10">
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-gold transition-colors">{product.name}</p>
              <p className="text-xs text-gold font-mono font-bold mt-0.5">${product.price.toLocaleString()}</p>
            </div>
            <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest hidden sm:block">
              {new Date(product.viewedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
