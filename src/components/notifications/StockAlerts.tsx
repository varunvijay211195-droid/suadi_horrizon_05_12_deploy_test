'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Bell, BellOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StockAlert {
  productId: string;
  name: string;
  price: number;
  images: string[];
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

export default function StockAlerts() {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    fetchStockAlerts();
  }, [user]);

  const fetchStockAlerts = async () => {
    try {
      setLoading(true);
      setHasError(false);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/notifications/stock-alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock alerts');
      }

      const data = await response.json();
      setStockAlerts(data || []);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromStockAlert = async (productId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/notifications/stock-alerts?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      toast.success('Unsubscribed from stock alerts');
      fetchStockAlerts();
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe');
    }
  };

  if (!user) return null;

  if (loading && stockAlerts.length === 0) {
    return null;
  }

  if (stockAlerts.length === 0) return null;

  return (
    <div className="p-6 bg-gold/[0.03] border border-gold/20 rounded-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-bold text-gold uppercase tracking-[0.2em]">
          Stock Alerts
        </h3>
      </div>

      <div className="space-y-4">
        {stockAlerts.map((alert) => (
          <div
            key={alert.productId}
            className="flex items-center space-x-4 p-3 rounded-xl bg-navy/40 border border-white/5 hover:border-gold/30 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10 shrink-0">
              {alert.images && alert.images.length > 0 && (
                <img
                  src={alert.images[0]}
                  alt={alert.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{alert.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gold font-bold px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                  Waiting for stock
                </span>
              </div>
            </div>
            <button
              onClick={() => unsubscribeFromStockAlert(alert.productId)}
              className="p-2 text-white/20 hover:text-red-400 transition-colors"
              title="Remove alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
