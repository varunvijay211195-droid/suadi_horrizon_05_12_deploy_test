import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

interface Notification {
  id: string;
  type: 'viewed_product' | 'stock_alert' | 'banner';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    connectToWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const connectToWebSocket = () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
      socketRef.current = new WebSocket(`${wsUrl}/notifications`);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        socketRef.current?.send(JSON.stringify({
          type: 'authenticate',
          userId: user?.id || user?._id,
        }));
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleNewNotification(data);
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(connectToWebSocket, 5000); // Reconnect after 5 seconds
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show notification immediately
    setCurrentNotification(notification);
    setShowNotification(true);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
      setCurrentNotification(null);
    }, 5000);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    switch (notification.type) {
      case 'viewed_product':
        router.push(`/product/${notification.data.productId}`);
        break;
      case 'stock_alert':
        router.push(`/product/${notification.data.productId}`);
        break;
      case 'banner':
        if (notification.data.linkUrl) {
          window.open(notification.data.linkUrl, '_blank');
        }
        break;
      default:
        break;
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Badge */}
      <button
        onClick={() => setShowNotification(true)}
        className="relative p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotification && currentNotification && (
        <div className="fixed bottom-16 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-1">{currentNotification.title}</h4>
            <p className="text-sm text-gray-600">{currentNotification.message}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => handleNotificationClick(currentNotification)}
              className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              View
            </button>
            <button
              onClick={closeNotification}
              className="w-full px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
