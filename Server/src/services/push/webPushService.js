const { webpush, pushEnabled } = require("../../config/webPush");
const PushSubscription = require("../../models/pushSubscriptionModel");

// Deliver a payload to a set of subscription docs, pruning any the push service
// reports as gone (404/410). Other errors are transient and ignored.
async function deliver(subs, payload) {
    const data = JSON.stringify(payload);
    const stale = [];
    await Promise.all(
        subs.map(async (s) => {
            try {
                await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, data);
            } catch (e) {
                if (e.statusCode === 404 || e.statusCode === 410) stale.push(s._id);
            }
        })
    );
    if (stale.length) await PushSubscription.deleteMany({ _id: { $in: stale } }).catch(() => {});
}

// Send a background push to specific users (e.g. a test's participants). No-op
// unless VAPID keys are configured. Payload: { title, body, url?, tag? }.
async function sendPushToUsers(userIds, payload) {
    if (!pushEnabled() || !userIds || !userIds.length) return;
    try {
        const subs = await PushSubscription.find({ user: { $in: userIds } }).lean();
        if (subs.length) await deliver(subs, payload);
    } catch (e) {
        console.warn("[web-push] send to users failed:", e.message);
    }
}

// Send a background push to every subscriber (a staff broadcast). No-op unless
// VAPID keys are configured.
async function sendBroadcastPush(payload) {
    if (!pushEnabled()) return;
    try {
        const subs = await PushSubscription.find({}).lean();
        if (subs.length) await deliver(subs, payload);
    } catch (e) {
        console.warn("[web-push] broadcast failed:", e.message);
    }
}

module.exports = { sendPushToUsers, sendBroadcastPush };
