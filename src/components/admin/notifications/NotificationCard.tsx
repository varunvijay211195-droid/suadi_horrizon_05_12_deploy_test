import { Notification } from "@/types/admin";
import {
    Bell,
    ShoppingCart,
    Users,
    Box,
    FileText,
    Clock,
    Check,
    ArrowRight,
    Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface NotificationCardProps {
    notification: Notification;
    idx: number;
    onClick: (n: Notification) => void;
    onMarkRead: (id: string) => void;
    onDelete: (id: string) => void;
}

export const NotificationCard = ({
    notification,
    idx,
    onClick,
    onMarkRead,
    onDelete
}: NotificationCardProps) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
            case 'user': return <Users className="w-5 h-5 text-blue-500" />;
            case 'inventory': return <Box className="w-5 h-5 text-amber-500" />;
            case 'quote': return <FileText className="w-5 h-5 text-gold" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onClick(notification)}
            className={`group relative p-8 flex items-start gap-6 hover:bg-white/[0.02] transition-all cursor-pointer ${!notification.isRead ? 'bg-gold/[0.02]' : ''}`}
        >
            {!notification.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
            )}

            <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:scale-110 transition-transform`}>
                {getIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold tracking-tight transition-colors ${!notification.isRead ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {notification.title}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-600 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(notification.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                </div>
                <p className={`text-sm leading-relaxed ${!notification.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                    {notification.message}
                </p>

                <div className="pt-2 flex items-center gap-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-white/5 text-slate-600 px-2">
                        ID: #{notification._id ? notification._id.slice(-6) : 'N/A'}
                    </Badge>
                    {!notification.isRead && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMarkRead(notification._id); }}
                            className="text-[9px] font-black uppercase text-gold hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" /> Dismiss
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
                        className="text-[9px] font-black uppercase text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-gold">
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
};
