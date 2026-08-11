const mongoose = require("mongoose");

// Self-hosted error capture (audit C3): client crashes + server 5xx land here so
// the founder isn't "launching blind" — visible in the admin panel, no third
// party required. Auto-expires after 30 days so it never grows unbounded. The
// controller/error-handler that write here are also the seam to ALSO forward to
// Sentry/PostHog later (gated on an env DSN) without touching call sites.
const ErrorLogSchema = new mongoose.Schema(
    {
        source: { type: String, enum: ["client", "server"], required: true, index: true },
        message: { type: String, default: "" },
        stack: { type: String },
        url: { type: String }, // request path (server) / page URL (client)
        method: { type: String },
        statusCode: { type: Number },
        userAgent: { type: String },
        release: { type: String }, // client build tag, when provided
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        meta: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

// TTL: drop entries after 30 days.
ErrorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("ErrorLog", ErrorLogSchema);
