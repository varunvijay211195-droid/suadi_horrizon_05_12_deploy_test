import { Loader2 } from "lucide-react";

export const NotificationSkeleton = () => {
    return (
        <div className="h-[500px] flex flex-col items-center justify-center gap-4 opacity-30">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Activity...</p>
        </div>
    );
};
