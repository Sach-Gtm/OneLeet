import api from "@/Api/axios";

// Background Web Push (notifications that arrive even when the browser tab is
// closed). Layered on top of the foreground notifications in systemNotify.js.
// Everything here is best-effort and no-ops gracefully when unsupported or when
// the server has no VAPID keys configured.

const swSupported = () =>
    typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

// VAPID public key comes base64url-encoded; the PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
    return arr;
}

// Register the service worker, subscribe to push with the server's VAPID key,
// and store the subscription on the backend. Returns true if a subscription is
// active. Safe to call repeatedly (re-uses an existing subscription).
export async function enableBackgroundPush() {
    if (!swSupported()) return false;
    try {
        const { data } = await api.get("/push/vapid-public-key");
        if (!data?.enabled || !data?.publicKey) return false; // server not configured
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey),
            });
        }
        await api.post("/push/subscribe", sub.toJSON());
        return true;
    } catch {
        return false; // unsupported, permission race, or VAPID mismatch — fall back to foreground
    }
}
