import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationState } from '@/types/admin';
import { notificationsApi } from '@/lib/api/admin/notifications';
import { toast } from 'sonner';

export function useAdminNotifications(initialFilter: string = 'all') {
    const [state, setState] = useState<NotificationState>({
        status: 'loading',
        data: [],
        unreadCount: 0
    });
    const [filter, setFilter] = useState(initialFilter);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchNotifications = useCallback(async () => {
        setState(prev => ({ ...prev, status: 'loading' }));
        try {
            const data = await notificationsApi.getAll(filter);
            const notifications = data.notifications || [];
            setState({
                status: notifications.length > 0 ? 'success' : 'empty',
                data: notifications,
                unreadCount: notifications.filter((n: Notification) => !n.isRead).length
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                status: 'error',
                error: error.message || "Failed to fetch notifications"
            }));
            toast.error("Failed to fetch notifications");
        }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setState(prev => ({
                ...prev,
                data: prev.data.map(n => n._id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, prev.unreadCount - 1)
            }));
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setState(prev => ({
                ...prev,
                data: prev.data.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await notificationsApi.delete(id);
            setState(prev => {
                const wasUnread = prev.data.find(n => n._id === id)?.isRead === false;
                const newData = prev.data.filter(n => n._id !== id);
                return {
                    ...prev,
                    data: newData,
                    status: newData.length > 0 ? 'success' : 'empty',
                    unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
                };
            });
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const filteredNotifications = state.data.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        state,
        filter,
        setFilter,
        searchTerm,
        setSearchTerm,
        filteredNotifications,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
}
