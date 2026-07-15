const mongoose = require("mongoose");

// One row per client "heartbeat" — a few seconds of time spent on a given page.
// Logged-in pings carry `user`; anonymous landing/marketing pings carry only an
// `anonId` (a random id the browser keeps for the visit) so we can still count
// aggregate traffic without attaching it to a person. Aggregated on read for
// per-student minutes, per-page breakdowns, and site-wide traffic.
const ActivitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        anonId: { type: String, default: null },
        path: { type: String, default: "", maxlength: 200 },
        seconds: { type: Number, default: 0, min: 0, max: 600 },
    },
    { timestamps: true }
);

// Time-window scans (site traffic, "active today"), and per-user history.
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", ActivitySchema);
