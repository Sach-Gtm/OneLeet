const Referral = require("../../models/referralModel");

// GET /api/referrals/me — the student's referral code + progress. Creates the
// code on first view (format: first 4 letters of the name + 2027).
async function myReferral(req, res, next) {
    try {
        const ref = await Referral.ensureFor(req.user._id, req.user.name);
        const count = ref.conversions.length;
        const threshold = Referral.REWARD_THRESHOLD;
        return res.json({
            success: true,
            referral: {
                code: ref.code,
                conversionCount: count,
                threshold,
                remaining: Math.max(0, threshold - count),
                rewardUnlocked: Boolean(ref.rewardUnlockedAt),
                rewardFulfilled: Boolean(ref.rewardFulfilledAt),
            },
        });
    } catch (e) {
        next(e);
    }
}

// ── Admin (requireAdmin) ────────────────────────────────────────────────────
async function adminListReferrals(req, res, next) {
    try {
        const refs = await Referral.find()
            .sort({ rewardUnlockedAt: -1, "conversions.length": -1, createdAt: -1 })
            .populate("user", "name email")
            .limit(300);
        return res.json({
            success: true,
            referrals: refs.map((r) => ({
                _id: r._id,
                user: r.user,
                code: r.code,
                conversionCount: r.conversions.length,
                rewardUnlocked: Boolean(r.rewardUnlockedAt),
                rewardUnlockedAt: r.rewardUnlockedAt,
                rewardFulfilled: Boolean(r.rewardFulfilledAt),
                rewardFulfilledAt: r.rewardFulfilledAt,
            })),
        });
    } catch (e) {
        next(e);
    }
}

// POST /api/referrals/admin/:id/fulfilled — mark the merch + 1:1 reward done.
async function adminMarkFulfilled(req, res, next) {
    try {
        const ref = await Referral.findById(req.params.id);
        if (!ref) return res.status(404).json({ success: false, message: "Referral not found." });
        ref.rewardFulfilledAt = req.body?.undo ? null : new Date();
        await ref.save();
        return res.json({ success: true, rewardFulfilled: Boolean(ref.rewardFulfilledAt) });
    } catch (e) {
        next(e);
    }
}

module.exports = { myReferral, adminListReferrals, adminMarkFulfilled };
