const mongoose = require("mongoose");
const { CACHE_TTL_DAYS } = require("../config/aiLimits");

// Response cache: a normalized AI request (feature + params) is generated once,
// stored here, and reused for free by everyone after. This is the biggest cost
// saver — and the reused entries become a self-growing bank of questions,
// explanations and plans.
const AiCacheSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true }, // sha256 of feature + normalized params
        feature: { type: String, default: "" },
        response: { type: mongoose.Schema.Types.Mixed }, // the exact payload we returned
        hits: { type: Number, default: 0 },
        lastUsedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Auto-expire entries CACHE_TTL_DAYS after creation (MongoDB TTL monitor).
AiCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: CACHE_TTL_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model("AiCache", AiCacheSchema);
