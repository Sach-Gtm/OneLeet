const mongoose = require("mongoose");

// One row per AI generation that reached the runtime — a cache hit OR a real
// provider call. This is the per-feature token/cost log that powers the admin
// spending dashboard and the per-user daily quota meter (non-cached rows only).
const AiUsageSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        feature: { type: String, default: "questions" }, // questions|predict-difficulty|analyze|study-plan|draft|...
        provider: { type: String, default: "" }, // gemini | stub
        model: { type: String, default: "" },
        cacheHit: { type: Boolean, default: false },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        estCostUsd: { type: Number, default: 0 },
        plan: { type: String, default: "free" }, // the user's plan at the time
    },
    { timestamps: true }
);

AiUsageSchema.index({ createdAt: -1 });
// Quota counting: today's NON-cached calls for a user.
AiUsageSchema.index({ user: 1, cacheHit: 1, createdAt: -1 });

module.exports = mongoose.model("AiUsage", AiUsageSchema);
