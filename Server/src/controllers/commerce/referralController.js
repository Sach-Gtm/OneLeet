const Referral = require("../../models/referralModel");

// GET /api/referrals/me — the student's referral code + cash earnings. Creates
// the code on first view (format: first 4 letters of the name + 2027).
async function myReferral(req, res, next) {
    try {
        const ref = await Referral.ensureFor(req.user._id, req.user.name);
        const conv = ref.conversions || [];
        const totalEarned = conv.reduce((s, c) => s + (c.rewardAmount || 0), 0);
        const paidOut = conv.filter((c) => c.payoutStatus === "paid").reduce((s, c) => s + (c.rewardAmount || 0), 0);
        const pending = totalEarned - paidOut;
        const nextDue = conv
            .filter((c) => c.payoutStatus !== "paid" && c.payoutDueAt)
            .map((c) => c.payoutDueAt)
            .sort((a, b) => new Date(a) - new Date(b))[0] || null;

        return res.json({
            success: true,
            referral: {
                code: ref.code,
                rewardPct: Referral.REWARD_PCT,
                payoutDelayDays: Referral.PAYOUT_DELAY_DAYS,
                // cash reward
                referredPaidCount: conv.length,   // friends who paid with the code
                totalEarned,
                paidOut,
                pending,
                nextPayoutAt: nextDue,
                // legacy signup-threshold fields (kept for backward compatibility)
                conversionCount: conv.length,
                threshold: Referral.REWARD_THRESHOLD,
                remaining: Math.max(0, Referral.REWARD_THRESHOLD - conv.length),
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
// and can't be the buyer's own. Returns 200 with { valid, message } either way.
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

// GET /api/referrals/admin/payouts — the payout ledger: one row per referred
// purchase, with who to pay, how much (7%), and when it's due (paid + ~1.25mo).
async function adminListPayouts(req, res, next) {
    try {
        const refs = await Referral.find({ "conversions.0": { $exists: true } })
            .populate("user", "name email phone")
            .populate("conversions.referredUser", "name email phone")
            .limit(500)
            .lean();

        const now = Date.now();
        const payouts = [];
        for (const r of refs) {
            for (const c of r.conversions || []) {
                if (!c.rewardAmount) continue; // legacy conversions with no cash reward
                payouts.push({
                    referralId: r._id,
                    orderId: c.order,
                    code: r.code,
                    referrer: r.user ? { id: r.user._id, name: r.user.name, email: r.user.email, phone: r.user.phone } : null,
                    referred: c.referredUser ? { name: c.referredUser.name, email: c.referredUser.email, phone: c.referredUser.phone } : null,
                    courseValue: c.amount || 0,
                    reward: c.rewardAmount || 0,
                    referredPaidOn: c.at,
                    payoutDueAt: c.payoutDueAt,
                    status: c.payoutStatus || "pending",
                    dueNow: c.payoutStatus !== "paid" && c.payoutDueAt && new Date(c.payoutDueAt).getTime() <= now,
                    paidAt: c.paidAt || null,
                    note: c.payoutNote || "",
                });
            }
        }
        // Soonest-actionable first: due-now, then upcoming pending, then paid.
        payouts.sort((a, b) => {
            const rank = (p) => (p.status === "paid" ? 2 : p.dueNow ? 0 : 1);
            if (rank(a) !== rank(b)) return rank(a) - rank(b);
            return new Date(a.payoutDueAt || 0) - new Date(b.payoutDueAt || 0);
        });

        const pendingRows = payouts.filter((p) => p.status !== "paid");
        const summary = {
            count: payouts.length,
            totalPending: pendingRows.reduce((s, p) => s + p.reward, 0),
            totalDueNow: pendingRows.filter((p) => p.dueNow).reduce((s, p) => s + p.reward, 0),
            dueNowCount: pendingRows.filter((p) => p.dueNow).length,
            totalPaid: payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.reward, 0),
            rewardPct: Referral.REWARD_PCT,
            payoutDelayDays: Referral.PAYOUT_DELAY_DAYS,
        };
        return res.json({ success: true, summary, payouts });
    } catch (e) {
        next(e);
    }
}

// POST /api/referrals/admin/payouts/pay — mark one referral payout paid (or undo).
// body: { referralId, orderId, note?, undo? }
async function adminMarkPaid(req, res, next) {
    try {
        const { referralId, orderId, note = "", undo = false } = req.body || {};
        if (!referralId || !orderId) return res.status(400).json({ success: false, message: "referralId and orderId are required." });
        const ref = await Referral.findById(referralId);
        if (!ref) return res.status(404).json({ success: false, message: "Referral not found." });
        const c = ref.conversions.find((x) => String(x.order) === String(orderId));
        if (!c) return res.status(404).json({ success: false, message: "Payout not found." });

        if (undo) {
            c.payoutStatus = "pending";
            c.paidAt = null;
        } else {
            c.payoutStatus = "paid";
            c.paidAt = new Date();
            if (note) c.payoutNote = String(note).slice(0, 140);
        }
        ref.markModified("conversions");
        await ref.save();
        return res.json({ success: true, status: c.payoutStatus, paidAt: c.paidAt, note: c.payoutNote });
    } catch (e) {
        next(e);
    }
}

// GET /api/referrals/admin — legacy list (kept; used by the older reward view).
async function adminListReferrals(req, res, next) {
    try {
        const refs = await Referral.find()
            .sort({ rewardUnlockedAt: -1, createdAt: -1 })
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

// POST /api/referrals/admin/:id/fulfilled — legacy: mark the 1:1 reward done.
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

module.exports = { myReferral, validateReferral, adminListPayouts, adminMarkPaid, adminListReferrals, adminMarkFulfilled };
