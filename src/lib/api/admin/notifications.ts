import axios from 'axios';
import { Notification } from '@/types/admin';

const getHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}` };
};

export const notificationsApi = {
    getAll: async (filter?: string) => {
        const query = filter && filter !== 'all' ? `?unreadOnly=${filter === 'unread'}` : '';
        const res = await axios.get(`/api/admin/notifications${query}`, { headers: getHeaders() });
        return res.data;
    },
    markAsRead: async (id: string) => {
        const res = await axios.patch(`/api/admin/notifications/${id}/read`, {}, { headers: getHeaders() });
        return res.data;
    },
    markAllAsRead: async () => {
        const res = await axios.patch('/api/admin/notifications/read-all', {}, { headers: getHeaders() });
        return res.data;
    },
    delete: async (id: string) => {
        const res = await axios.delete(`/api/admin/notifications/${id}`, { headers: getHeaders() });
        return res.data;
    }
};
