// Thin wrapper around the browser Notification API for OS-level ("system")
// notifications. This is the FOREGROUND path: it shows a real desktop/phone
// notification whenever a OneLeet tab is open (even in the background). True
// background push (arriving with the browser closed) is a separate Web Push /
// service-worker feature layered on top of this later.

export const notificationsSupported = () =>
    typeof window !== "undefined" && "Notification" in window;

// "granted" | "denied" | "default" | "unsupported"
export const notificationPermission = () =>
    notificationsSupported() ? Notification.permission : "unsupported";

// Ask the browser for permission. Must be called from a user gesture (a click),
// or browsers ignore it. Returns the resulting permission string.
export async function requestNotificationPermission() {
    if (!notificationsSupported()) return "unsupported";
    try {
        return await Notification.requestPermission();
    } catch {
        return Notification.permission;
    }
}

// Show one OS notification. No-op unless the user has granted permission.
// `url` (optional) is opened when the notification is clicked.
export function showSystemNotification(title, { body, tag, url } = {}) {
    if (!notificationsSupported() || Notification.permission !== "granted") return;
    try {
        const n = new Notification(title, {
            body,
            tag, // same tag replaces an earlier notification instead of stacking
            icon: "/favicon.svg",
            badge: "/favicon.svg",
        });
        n.onclick = () => {
            try {
                window.focus();
            } catch {
                // focusing may be blocked in some contexts — ignore
            }
            if (url) window.location.assign(url);
            n.close();
        };
    } catch {
        // Some browsers throw if constructed outside a service worker under
        // certain permission states — fail quietly, the in-app bell still works.
    }
}
