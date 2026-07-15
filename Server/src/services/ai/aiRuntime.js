const crypto = require("crypto");
const AiUsage = require("../../models/aiUsageModel");
const AiCache = require("../../models/aiCacheModel");
const aiService = require("./aiService");
const { COST_PER_MTOK, dailyLimitFor } = require("../../config/aiLimits");

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};
const startOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Normalize a request into a stable cache key: trim + lowercase strings, sort
// keys, drop empties. So "Logic Gates"/moderate/5 hits the same entry however
// it's typed.
function cacheKey(feature, params) {
    const norm = {};
    for (const k of Object.keys(params || {}).sort()) {
        let v = params[k];
        if (v == null || v === "") continue;
        if (typeof v === "string") v = v.trim().toLowerCase();
        else if (Array.isArray(v)) v = v.map((x) => String(x).trim().toLowerCase()).sort();
        norm[k] = v;
    }
    return crypto.createHash("sha256").update(`${feature}|${JSON.stringify(norm)}`).digest("hex");
}

// Cheap, provider-agnostic token estimate (≈ 4 chars/token) — good enough for a
// spend estimate, and works identically for every provider.
const estTokens = (obj) => Math.ceil(String(obj == null ? "" : JSON.stringify(obj)).length / 4);
const estCost = (inTok, outTok) =>
    (inTok / 1e6) * COST_PER_MTOK.input + (outTok / 1e6) * COST_PER_MTOK.output;

const planOf = (user) => (user?.plan === "pro" ? "pro" : "free");
const logUsage = (fields) => {
    AiUsage.create(fields).catch(() => {});
};

// Today's REAL (non-cached) generations for a user — the quota meter.
function usedToday(userId) {
    return AiUsage.countDocuments({ user: userId, cacheHit: false, createdAt: { $gte: startOfToday() } });
}

// The caller's current quota snapshot (for the UI meter). limit null = unlimited.
async function quotaFor(user) {
    const limit = dailyLimitFor(user);
    if (limit == null) {
        return { unlimited: true, limit: null, used: 0, remaining: null, plan: planOf(user) };
    }
    const used = await usedToday(user._id);
    return { unlimited: false, limit, used, remaining: Math.max(0, limit - used), plan: planOf(user) };
}

// The single entry point every AI feature goes through:
//   1) cache hit  → free, doesn't touch the quota
//   2) quota check → students only; throws a 429-tagged error when exhausted
//   3) generate    → the real provider call
//   4) store + log → cache the result, record token/cost estimate
async function runAiFeature({ user, feature, cacheParams, inputText = "", generate }) {
    const key = cacheKey(feature, cacheParams);

    // 1. Cache
    const cached = await AiCache.findOneAndUpdate(
        { key },
        { $inc: { hits: 1 }, $set: { lastUsedAt: new Date() } },
        { returnDocument: "after" }
    ).lean();
    if (cached) {
        logUsage({ user: user._id, feature, cacheHit: true, plan: planOf(user) });
        return { result: cached.response, cacheHit: true };
    }

    // 2. Quota (staff → dailyLimitFor returns null → skipped)
    const limit = dailyLimitFor(user);
    if (limit != null) {
        const used = await usedToday(user._id);
        if (used >= limit) {
            const isFree = planOf(user) === "free";
            const e = new Error(
                `You've used all ${limit} of your ${isFree ? "free" : "premium"} AI generations for today. ` +
                    (isFree
                        ? "Upgrade to premium for a lot more, or come back tomorrow."
                        : "Please come back tomorrow.")
            );
            e.status = 429;
            e.quota = { used, limit, remaining: 0, plan: planOf(user), unlimited: false };
            throw e;
        }
    }

    // 3. Generate
    const result = await generate();

    // 4. Cache + log (dup-key races are harmless — first writer wins)
    AiCache.create({ key, feature, response: result }).catch(() => {});
    const inputTokens = estTokens(inputText) + estTokens(cacheParams);
    const outputTokens = estTokens(result);
    logUsage({
        user: user._id,
        feature,
        cacheHit: false,
        provider: aiService.activeProvider(),
        model:
            aiService.activeProvider() === "gemini"
                ? process.env.GEMINI_MODEL || "gemini-flash-lite-latest"
                : "stub",
        inputTokens,
        outputTokens,
        estCostUsd: estCost(inputTokens, outputTokens),
        plan: planOf(user),
    });

    return { result, cacheHit: false };
}

// Admin spend dashboard: today + this-month totals, cache-hit rate, estimated
// cost, per-feature breakdown, and the heaviest users this month.
async function usageSummary() {
    const groupTotals = {
        _id: null,
        calls: { $sum: 1 },
        cached: { $sum: { $cond: ["$cacheHit", 1, 0] } },
        inputTokens: { $sum: "$inputTokens" },
        outputTokens: { $sum: "$outputTokens" },
        estCostUsd: { $sum: "$estCostUsd" },
    };
    const [today, month, byFeature, topUsersRaw] = await Promise.all([
        AiUsage.aggregate([{ $match: { createdAt: { $gte: startOfToday() } } }, { $group: groupTotals }]),
        AiUsage.aggregate([{ $match: { createdAt: { $gte: startOfMonth() } } }, { $group: groupTotals }]),
        AiUsage.aggregate([
            { $match: { createdAt: { $gte: startOfMonth() } } },
            {
                $group: {
                    _id: "$feature",
                    calls: { $sum: 1 },
                    cached: { $sum: { $cond: ["$cacheHit", 1, 0] } },
                    estCostUsd: { $sum: "$estCostUsd" },
                },
            },
            { $sort: { calls: -1 } },
        ]),
        AiUsage.aggregate([
            { $match: { createdAt: { $gte: startOfMonth() }, cacheHit: false } },
            { $group: { _id: "$user", calls: { $sum: 1 }, estCostUsd: { $sum: "$estCostUsd" } } },
            { $sort: { calls: -1 } },
            { $limit: 8 },
        ]),
    ]);

    // Resolve top-user names.
    const User = require("../../models/userModel");
    const users = await User.find({ _id: { $in: topUsersRaw.map((u) => u._id).filter(Boolean) } }).select(
        "name email plan"
    );
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    const topUsers = topUsersRaw.map((u) => {
        const info = uMap.get(String(u._id));
        return {
            userId: u._id,
            name: info?.name || "Unknown",
            plan: info?.plan || "free",
            calls: u.calls,
            estCostUsd: u.estCostUsd,
        };
    });

    const shape = (row) => {
        const r = row[0] || {};
        const calls = r.calls || 0;
        const cached = r.cached || 0;
        return {
            calls,
            cached,
            billable: calls - cached,
            cacheHitRate: calls ? Math.round((cached / calls) * 100) : 0,
            inputTokens: r.inputTokens || 0,
            outputTokens: r.outputTokens || 0,
            estCostUsd: Math.round((r.estCostUsd || 0) * 10000) / 10000,
        };
    };

    return {
        today: shape(today),
        month: shape(month),
        byFeature: byFeature.map((f) => ({
            feature: f._id || "unknown",
            calls: f.calls,
            cached: f.cached,
            estCostUsd: Math.round((f.estCostUsd || 0) * 10000) / 10000,
        })),
        topUsers,
    };
}

module.exports = { runAiFeature, quotaFor, usageSummary, cacheKey };
