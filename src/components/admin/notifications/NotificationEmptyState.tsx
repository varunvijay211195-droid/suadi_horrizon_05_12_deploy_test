import { Bell } from "lucide-react";

export const NotificationEmptyState = () => {
    return (
        <div className="h-[500px] flex flex-col items-center justify-center gap-4 opacity-20">
            <Bell className="w-16 h-16" />
            <p className="text-sm font-bold tracking-tight text-white">Your activity history is empty</p>
        </div>
    );
};
