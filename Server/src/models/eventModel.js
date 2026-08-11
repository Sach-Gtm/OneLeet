const mongoose = require("mongoose");

// Product-analytics events for the acquisition funnel (audit C3): land →
// register → onboarding → first test → paywall → payment. Self-hosted (no
// PostHog/GA required). Pre-login events carry an anonId (the same stable
// per-browser id the activity heartbeat uses), logged-in ones carry the user,
// so the funnel can be counted by distinct identity. TTL-expired after 90 days.
const EventSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        anonId: { type: String, index: true },
        path: { type: String },
        props: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

EventSchema.index({ name: 1, createdAt: -1 });
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Event", EventSchema);
