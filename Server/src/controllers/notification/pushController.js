const PushSubscription = require("../../models/pushSubscriptionModel");
const { getPublicKey, pushEnabled } = require("../../config/webPush");

// GET /api/push/vapid-public-key — the browser needs this to subscribe. Also
// tells the client whether background push is configured at all.
function vapidPublicKey(req, res) {
    return res.status(200).json({ success: true, enabled: pushEnabled(), publicKey: getPublicKey() });
}

// POST /api/push/subscribe — store (or refresh) this browser's push subscription
// for the signed-in user. Keyed by endpoint so re-subscribing just updates.
async function subscribe(req, res, next) {
    try {
        const { endpoint, keys } = req.body || {};
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({ success: false, message: "Invalid subscription" });
        }
        // Key by (endpoint, user) so a caller who learns another user's endpoint
        // can't reassign that subscription to themselves — the owner's row is left
        // untouched.
        await PushSubscription.updateOne(
            { endpoint, user: req.user._id },
            { $set: { user: req.user._id, endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } },
            { upsert: true }
        );
        return res.status(201).json({ success: true });
    } catch (e) {
        next(e);
    }
}

// POST /api/push/unsubscribe — remove this browser's subscription.
async function unsubscribe(req, res, next) {
    try {
        const { endpoint } = req.body || {};
        if (endpoint) await PushSubscription.deleteOne({ endpoint, user: req.user._id });
        return res.status(200).json({ success: true });
    } catch (e) {
        next(e);
    }
}

module.exports = { vapidPublicKey, subscribe, unsubscribe };
