/* global clients */
// OneLeet push handlers, imported into the PWA service worker (see
// vite.config.js workbox.importScripts). Shows a background Web Push
// notification (delivered even when the app is closed) and focuses/opens the
// app when one is tapped. Server payload: { title, body, url?, tag? }.

self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: "OneLeet", body: event.data && event.data.text ? event.data.text() : "" };
    }
    const title = data.title || "OneLeet";
    const options = {
        body: data.body || "",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: data.tag,
        data: { url: data.url || "/dashboard" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || "/dashboard";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
            for (const w of wins) {
                if ("focus" in w) {
                    w.focus();
                    if (w.navigate) w.navigate(url);
                    return undefined;
                }
            }
            return clients.openWindow ? clients.openWindow(url) : undefined;
        })
    );
});
