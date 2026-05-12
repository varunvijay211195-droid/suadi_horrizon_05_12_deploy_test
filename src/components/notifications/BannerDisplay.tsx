import { useState, useEffect } from 'react';
import { useSession } from '@/contexts/AuthContext';

interface Banner {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  position: 'top' | 'bottom' | 'sidebar' | 'modal';
  displayOrder: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  targetAudience?: 'all' | 'new_users' | 'returning_users' | 'specific_users';
  targetUserIds?: string[];
}

export default function BannerDisplay() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;

    fetchBanners();
  }, [user]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = (user as any)?.token || null;
      const response = await fetch('/api/notifications/banners', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-Type': getUserType(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const data = (await response.json()) as Banner[];
      setBanners(data);

      const now = new Date();
      const validBanners = data.filter((banner: Banner) => {
        return banner.isActive &&
          banner.startDate <= now &&
          banner.endDate >= now &&
          isBannerVisible(banner);
      }).sort((a, b) => a.displayOrder - b.displayOrder);

      if (validBanners.length > 0) {
        setActiveBanner(validBanners[0]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const getUserType = () => {
    if (!user) return 'guest';
    // Implement logic to determine user type based on your auth system
    return 'returning_users';
  };

  const isBannerVisible = (banner: Banner) => {
    if (!user) {
      return banner.targetAudience === 'all' || banner.targetAudience === 'new_users';
    }

    switch (banner.targetAudience) {
      case 'all':
        return true;
      case 'new_users':
        // Implement logic to check if user is new
        return false;
      case 'returning_users':
        // Implement logic to check if user is returning
        return true;
      case 'specific_users':
        return banner.targetUserIds?.includes(user.id || user._id || '') || false;
      default:
        return false;
    }
  };

  const closeBanner = () => {
    setActiveBanner(null);
  };

  if (!user) return null;

  if (loading) {
    return null; // Don't show loading state for banners
  }

  if (hasError || !activeBanner) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg"
      style={{ display: activeBanner?.position === 'top' ? 'block' : 'none' }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {activeBanner.imageUrl && (
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.title}
                className="w-12 h-12 object-cover rounded mr-3"
              />
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">{activeBanner.title}</h4>
              <p className="text-sm text-gray-600">{activeBanner.content}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {activeBanner.linkUrl && (
              <a
                href={activeBanner.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Learn More
              </a>
            )}
            <button
              onClick={closeBanner}
              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
