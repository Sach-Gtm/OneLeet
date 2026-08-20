const User = require("../models/userModel");
const Enrollment = require("../models/enrollmentModel");
const Referral = require("../models/referralModel");
const Coupon = require("../models/couponModel");
const { sendPurchaseEmail } = require("../utils/onboardingEmails");

// Money + lifecycle logic for orders, kept out of the controller so it's unit
// testable. All amounts are rupees. Mirrors the client's data/pricing math so
// the checkout preview and the authoritative server total agree.

const DAY = 86400000;
const SPLIT_SURCHARGE_PCT = 30; // "Split Payment" costs 30% more than paying once
const SPLIT_ACCESS_DAYS = 30; // premium window opened by the first installment
const SPLIT_GRACE_DAYS = 3; // grace before the order locks
const CART_CAP = 1000; // max rupee discount from the multi-course tier

// Multi-course tier %, mirror of client data/pricing.cartExtraOff.
function cartExtraOff(n) {
    if (n >= 5) return 50;
    if (n >= 4) return 40;
    if (n >= 3) return 30;
    if (n >= 2) return 20;
    return 0;
}

// Authoritative money for a cart. `coupon` is a Coupon doc (or null).
function computeMoney(items, { plan = "full", coupon = null } = {}) {
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const cartDiscountPct = cartExtraOff(items.length);
    const cartDiscount = Math.min(Math.round((subtotal * cartDiscountPct) / 100), CART_CAP);
    const afterCart = subtotal - cartDiscount;
    const couponDiscount = coupon ? coupon.discountFor(afterCart) : 0;
    const baseTotal = Math.max(0, afterCart - couponDiscount);
    const surchargePct = plan === "split" ? SPLIT_SURCHARGE_PCT : 0;
    const payable = plan === "split" ? Math.round(baseTotal * (1 + SPLIT_SURCHARGE_PCT / 100)) : baseTotal;
    return { subtotal, cartDiscountPct, cartDiscount, couponDiscount, baseTotal, surchargePct, payable };
}

// Installment schedule. The 2nd installment's due/grace dates are set only when
// the 1st is paid (the window runs from that moment), so they start null here.
function buildInstallments(plan, payable) {
    if (plan === "split") {
        const half = Math.round(payable / 2);
        return [
            { n: 1, amount: half, status: "pending", dueAt: new Date() },
            { n: 2, amount: payable - half, status: "pending", dueAt: null },
        ];
    }
    return [{ n: 1, amount: payable, status: "pending", dueAt: new Date() }];
}

// Enroll the buyer in each purchased batch and rebuild their exam-code cache.
async function enrollAndSync(userId, items) {
    for (const it of items) {
        if (!it.course || !it.examCode) continue;
        // eslint-disable-next-line no-await-in-loop
        await Enrollment.findOneAndUpdate(
            { student: userId, course: it.course },
            { $set: { examCode: it.examCode, status: "active" } },
            { upsert: true, setDefaultsOnInsert: true }
        );
    }
    const rows = await Enrollment.find({ student: userId, status: "active" }, "examCode").lean();
    const codes = [...new Set(rows.map((r) => r.examCode).filter(Boolean))];
    await User.updateOne({ _id: userId }, { $set: { exams: codes } });
    return codes;
}

// Credit the referrer for a converted buyer (idempotent; guarded by the caller).
async function creditReferral(order) {
    if (!order.referralCode) return;
    const ref = await Referral.findOne({ code: order.referralCode.toUpperCase() });
    order.referralCredited = true; // mark handled regardless, so we don't retry
    if (!ref) return;
    if (String(ref.user) === String(order.user)) return; // no self-referral
    // One cash payout per referred student — their first purchase that applies
    // this code. (The reward follows the code applied at checkout; a friend who
    // signed up through a link still earns it by applying the code when they pay.)
    if (ref.conversions.some((c) => String(c.referredUser) === String(order.user))) return;
    const at = order.firstPaidAt || new Date();
    const value = order.payable || 0;                                      // course value the friend paid
    const rewardAmount = Math.round((value * Referral.REWARD_PCT) / 100);  // 7%
    const payoutDueAt = new Date(at.getTime() + Referral.PAYOUT_DELAY_DAYS * DAY); // ~1.25 months later
    ref.conversions.push({
        referredUser: order.user, order: order._id, amount: value, at,
        rewardAmount, payoutDueAt, payoutStatus: "pending",
    });
    if (ref.conversions.length >= Referral.REWARD_THRESHOLD && !ref.rewardUnlockedAt) {
        ref.rewardUnlockedAt = new Date();
    }
    await ref.save();
}

// Apply a paid installment: mark it paid, grant/extend premium, enroll (first
// payment), and credit the referrer (first payment). Idempotent per installment.
async function markInstallmentPaid(order, installmentN, { paymentId = "", gatewayOrderId = "" } = {}) {
    const inst = order.installments.find((i) => i.n === installmentN);
    if (!inst) throw new Error(`Installment ${installmentN} not found on this order`);
    if (inst.status === "paid") return order; // idempotent

    const now = new Date();
    inst.status = "paid";
    inst.paidAt = now;
    if (paymentId) inst.gatewayPaymentId = paymentId;
    if (gatewayOrderId) inst.gatewayOrderId = gatewayOrderId;
    order.amountPaid = order.installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

    const isFirst = installmentN === 1;
    if (isFirst) order.firstPaidAt = now;
    const validityMs = (order.validityDays || 365) * DAY;

    if (order.paymentPlan === "split") {
        if (isFirst) {
            const second = order.installments.find((i) => i.n === 2);
            if (second) {
                second.dueAt = new Date(now.getTime() + SPLIT_ACCESS_DAYS * DAY);
                second.graceUntil = new Date(now.getTime() + (SPLIT_ACCESS_DAYS + SPLIT_GRACE_DAYS) * DAY);
            }
            order.grantsPremiumUntil = new Date(now.getTime() + (SPLIT_ACCESS_DAYS + SPLIT_GRACE_DAYS) * DAY);
            order.status = "partially_paid";
        } else {
            const anchor = order.firstPaidAt ? order.firstPaidAt.getTime() : now.getTime();
            order.grantsPremiumUntil = new Date(anchor + validityMs);
            order.status = "paid";
        }
    } else {
        order.grantsPremiumUntil = new Date(now.getTime() + validityMs);
        order.status = "paid";
    }

    await User.updateOne(
        { _id: order.user },
        { $set: { plan: "pro", premiumUntil: order.grantsPremiumUntil, premiumLocked: false } }
    );
    if (isFirst) await enrollAndSync(order.user, order.items);
    if (isFirst && order.referralCode && !order.referralCredited) await creditReferral(order);
    // Purchase-confirmation email (fire-and-forget; never block/fail a payment on it).
    if (isFirst) {
        User.findById(order.user).select("name email").lean()
            .then((u) => u && sendPurchaseEmail(u, order))
            .catch((e) => console.error("[purchase-email] lookup skipped:", e.message));
    }
    // Burn one coupon use on the first successful payment (not at cart time, so
    // abandoned carts don't consume the allowance). Atomic + limit-gated so the
    // counter can never exceed usageLimit even if several orders reach payment at
    // once (0 = unlimited). (Fully closing the create→pay window would mean
    // reserving the slot at order-create and releasing it on abandonment — a UX
    // trade-off with limited coupons, left to the founder to opt into.)
    if (isFirst && order.couponCode) {
        await Coupon.updateOne(
            {
                code: order.couponCode.toUpperCase(),
                $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
            },
            { $inc: { usedCount: 1 } }
        );
    }

    await order.save();
    return order;
}

// A split order whose second installment slipped past its grace window.
function isLapsed(order) {
    if (order.paymentPlan !== "split" || order.status !== "partially_paid") return false;
    const second = order.installments.find((i) => i.n === 2);
    return Boolean(second && second.graceUntil && second.graceUntil.getTime() < Date.now());
}

// Lazily move a lapsed split order to `locked` (premium already lapses via the
// user's premiumUntil, so free features remain). Avoids needing a cron.
async function lockIfLapsed(order) {
    if (isLapsed(order)) {
        order.status = "locked";
        await order.save();
    }
    return order;
}

// Admin reopens a locked/partially-paid split order so the student can pay the
// second installment again — a fresh 30+3-day window from now. Access resumes
// when they actually pay (markInstallmentPaid extends premium to full validity).
async function reopenOrder(order) {
    if (order.paymentPlan !== "split") throw new Error("Only split-payment orders can be reopened");
    const second = order.installments.find((i) => i.n === 2);
    if (!second || second.status === "paid") throw new Error("This order has no pending second installment");
    const now = new Date();
    second.dueAt = new Date(now.getTime() + SPLIT_ACCESS_DAYS * DAY);
    second.graceUntil = new Date(now.getTime() + (SPLIT_ACCESS_DAYS + SPLIT_GRACE_DAYS) * DAY);
    order.status = "partially_paid";
    await order.save();
    return order;
}

module.exports = {
    DAY, SPLIT_SURCHARGE_PCT, SPLIT_ACCESS_DAYS, SPLIT_GRACE_DAYS, CART_CAP,
    cartExtraOff, computeMoney, buildInstallments, enrollAndSync,
    markInstallmentPaid, isLapsed, lockIfLapsed, reopenOrder,
};
