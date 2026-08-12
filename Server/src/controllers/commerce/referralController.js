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

// POST /api/referrals/validate — check a referral code before checkout. Mirrors
// the credit rules (services/paymentService.creditReferral): the code must exist
// and can't be the buyer's own. Returns 200 with { valid, message } either way,
// so the client can show an inline "applied" / error state without HTTP errors.
async function validateReferral(req, res, next) {
    try {
        const code = String(req.body?.code || "").trim().toUpperCase();
        if (!code) return res.status(400).json({ success: false, valid: false, message: "Enter a referral code." });
        const ref = await Referral.findOne({ code });
        if (!ref) return res.status(200).json({ success: true, valid: false, message: "That referral code doesn't exist." });
        if (String(ref.user) === String(req.user._id))
            return res.status(200).json({ success: true, valid: false, message: "You can't use your own referral code." });
        return res.status(200).json({ success: true, valid: true, code, message: "Referral applied successfully" });
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

module.exports = { myReferral, validateReferral, adminListReferrals, adminMarkFulfilled };
