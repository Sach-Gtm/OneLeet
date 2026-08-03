const mongoose = require("mongoose");

// One browser's Web Push subscription for a user. A user can have several (one
// per device/browser). Keyed by the unique push `endpoint`; stale ones are
// pruned automatically when the push service reports them gone (404/410).
const PushSubscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        endpoint: { type: String, required: true, unique: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
