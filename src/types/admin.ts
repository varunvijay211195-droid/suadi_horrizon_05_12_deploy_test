export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'order' | 'user' | 'inventory' | 'quote' | 'system';
    isRead: boolean;
    createdAt: string;
    data?: any;
}

export type NotificationStatus = 'loading' | 'success' | 'empty' | 'error';

export interface NotificationState {
    status: NotificationStatus;
    data: Notification[];
    error?: string;
    unreadCount: number;
}
