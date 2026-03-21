"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Search,
    CheckCheck,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { NotificationCard } from "@/components/admin/notifications/NotificationCard";
import { NotificationSkeleton } from "@/components/admin/notifications/NotificationSkeleton";
import { NotificationEmptyState } from "@/components/admin/notifications/NotificationEmptyState";
import { Notification } from "@/types/admin";

export default function AdminNotificationsPage() {
    const {
        state,
        filter,
        setFilter,
        searchTerm,
        setSearchTerm,
        filteredNotifications,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useAdminNotifications();

    const router = useRouter();

    const navigateToDetail = (notif: Notification) => {
        if (!notif.isRead) markAsRead(notif._id);

        switch (notif.type) {
            case 'order': router.push('/admin/orders'); break;
            case 'user': router.push('/admin/users'); break;
            case 'inventory': router.push('/admin/inventory'); break;
            case 'quote': router.push('/admin/quotes'); break;
            default: break;
        }
    };

    return (
        <AdminLayout
            title="Notification Center"
            description="View and manage all system activity and alerts"
            onRefresh={refresh}
        >
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Filter activity history..."
                            className="pl-11 bg-white/[0.03] border-white/5 text-white h-12 rounded-2xl focus:ring-gold/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
                            {['all', 'unread'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-gold text-navy' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={markAllAsRead}
                            disabled={state.unreadCount === 0}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
                        >
                            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl min-h-[500px]">
                    <AnimatePresence mode="popLayout">
                        {state.status === 'loading' ? (
                            <NotificationSkeleton />
                        ) : state.status === 'empty' || filteredNotifications.length === 0 ? (
                            <NotificationEmptyState />
                        ) : state.status === 'error' ? (
                            <div className="h-[500px] flex flex-col items-center justify-center gap-4 text-red-400">
                                <p className="text-sm font-bold">{state.error}</p>
                                <Button onClick={refresh} variant="outline" className="border-red-400/20 text-red-400">Retry</Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {filteredNotifications.map((notif, idx) => (
                                    <NotificationCard
                                        key={notif._id}
                                        notification={notif}
                                        idx={idx}
                                        onClick={navigateToDetail}
                                        onMarkRead={markAsRead}
                                        onDelete={deleteNotification}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AdminLayout>
    );
}
