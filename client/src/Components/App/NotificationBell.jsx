import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing, Loader2, Trophy, Clock } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/Api/NotificationApi";
import {
    notificationsSupported,
    notificationPermission,
    requestNotificationPermission,
    showSystemNotification,
} from "@/lib/systemNotify";
import { enableBackgroundPush } from "@/lib/webPush";

// Where a notification deep-links, by type. Leaderboard → the ranked board;
// a test went-live / closing-soon alert → the test itself. Others don't link.
function deepLink(n) {
    if (!n.test) return undefined;
    if (n.type === "leaderboard") return `/tests/${n.test}/leaderboard`;
    if (n.type === "test-live" || n.type === "test-closing") return `/tests/${n.test}`;
    return undefined;
}

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
    const [perm, setPerm] = useState(notificationPermission());
    const ref = useRef(null);
    // Newest notification timestamp we've already seen, so a poll only fires an
    // OS notification for genuinely new items (and never for the first load).
    const lastTsRef = useRef(0);
    const seededRef = useRef(false);

    const load = useCallback(async () => {
        try {
            const data = await getNotifications();
            const list = data?.notifications || [];
            setItems(list);
            setUnread(data?.unreadCount || 0);

            const newest = list.reduce(
                (m, n) => Math.max(m, new Date(n.createdAt).getTime()),
                lastTsRef.current
            );
            // On later polls, pop an OS notification for each new, unread item
            // (capped so a burst can't spam the desktop). Skipped on first load.
            if (seededRef.current && notificationPermission() === "granted") {
                list
                    .filter((n) => !n.read && new Date(n.createdAt).getTime() > lastTsRef.current)
                    .slice(0, 3)
                    .forEach((n) =>
                        showSystemNotification(n.title, {
                            body: n.body,
                            tag: String(n._id),
                            url: deepLink(n),
                        })
                    );
            }
            lastTsRef.current = newest;
            seededRef.current = true;
        } catch {
            // silently ignore — the bell just won't update
        }
    }, []);

    const enableSystem = async () => {
        const p = await requestNotificationPermission();
        setPerm(p);
        if (p === "granted") {
            // Also subscribe to background push (works even with the app closed);
            // no-ops if the server has no VAPID keys — foreground still works.
            enableBackgroundPush().catch(() => {});
            showSystemNotification("Notifications are on 🎉", {
                body: "We'll alert you when there's something new.",
            });
        }
    };

    // If the user already granted permission (e.g. on a previous visit), make
    // sure this browser is subscribed for background push too.
    useEffect(() => {
        if (notificationPermission() === "granted") enableBackgroundPush().catch(() => {});
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

                    {/* Opt-in to OS notifications (shown while the app is open). */}
                    {notificationsSupported() && perm === "default" && (
                        <button
                            onClick={enableSystem}
                            className="flex w-full items-center gap-2.5 border-b border-slate-100 bg-indigo-50/60 px-4 py-2.5 text-left transition hover:bg-indigo-50"
                        >
                            <BellRing size={16} className="shrink-0 text-indigo-600" />
                            <span className="min-w-0">
                                <span className="block text-xs font-semibold text-indigo-800">Get alerts on your device</span>
                                <span className="block text-[11px] text-indigo-600/80">Turn on system notifications, one tap.</span>
                            </span>
                        </button>
                    )}
                    {notificationsSupported() && perm === "denied" && (
                        <p className="border-b border-slate-100 px-4 py-2 text-[11px] text-slate-400">
                            System notifications are blocked. Enable them for this site in your browser settings.
                        </p>
                    )}

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
                            items.map((n) => {
                                const isLeaderboard = n.type === "leaderboard" && n.test;
                                const isTestAlert = (n.type === "test-live" || n.type === "test-closing") && n.test;
                                const link = deepLink(n);
                                const cls =
                                    "block border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50";
                                const inner = (
                                    <div className="flex items-start gap-2">
                                        <span
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                n.read ? "bg-transparent" : "bg-indigo-500"
                                            }`}
                                        />
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                                                {isLeaderboard && (
                                                    <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                )}
                                                {isTestAlert && (
                                                    <Clock className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                )}
                                                {n.title}
                                            </p>
                                            <p className="text-sm text-slate-600">{n.body}</p>
                                            <p className="mt-0.5 text-xs text-slate-400">
                                                {timeAgo(n.createdAt)}
                                                {isLeaderboard && " · Tap to view your rank"}
                                                {isTestAlert && " · Tap to open the test"}
                                            </p>
                                        </div>
                                    </div>
                                );
                                return link ? (
                                    <Link
                                        key={n._id}
                                        to={link}
                                        onClick={() => setOpen(false)}
                                        className={cls}
                                    >
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={n._id} className={cls}>
                                        {inner}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
