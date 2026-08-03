/* global clients */
// OneLeet service worker — shows background Web Push notifications (delivered
// even when the app tab is closed) and focuses/opens the app when one is
// clicked. Registered by the app only after the user enables notifications.

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
        icon: "/favicon.svg",
        badge: "/favicon.svg",
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
