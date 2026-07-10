import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Loader2 } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/Api/NotificationApi";

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const load = useCallback(async () => {
        try {
            const data = await getNotifications();
            setItems(data?.notifications || []);
            setUnread(data?.unreadCount || 0);
        } catch {
            // silently ignore — the bell just won't update
        }
    }, []);

    // Initial fetch + light polling so pushed notifications show up.
    useEffect(() => {
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, [load]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const handleOpen = async () => {
        const next = !open;
        setOpen(next);
        if (next) {
            setLoading(items.length === 0);
            await load();
            setLoading(false);
            if (unread > 0) {
                setUnread(0);
                setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                markAllNotificationsRead().catch(() => {});
            }
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                            Notifications
                        </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            </div>
                        ) : items.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-slate-400">
                                You&apos;re all caught up.
                            </p>
                        ) : (
                            items.map((n) => (
                                <div
                                    key={n._id}
                                    className="border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                                >
                                    <div className="flex items-start gap-2">
                                        <span
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                n.read ? "bg-transparent" : "bg-indigo-500"
                                            }`}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {n.title}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {n.body}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
