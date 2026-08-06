const Coupon = require("../../models/couponModel");

// POST /api/coupons/apply — checkout preview. body: { code, cartTotal }
// Returns the rupee discount a coupon yields on the given (post-cart-discount)
// total, or a friendly reason it can't be used. Read-only (no usage burned).
async function applyCoupon(req, res, next) {
    try {
        const { code, cartTotal } = req.body || {};
        if (!code) return res.status(400).json({ success: false, message: "Enter a coupon code." });
        const total = Math.max(0, Number(cartTotal) || 0);
        const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
        if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code." });
        const bad = coupon.reasonUnusable(total);
        if (bad) return res.status(400).json({ success: false, message: bad });
        return res.json({
            success: true,
            code: coupon.code,
            discount: coupon.discountFor(total),
            description: coupon.description,
        });
    } catch (e) {
        next(e);
    }
}

// ── Admin CRUD (requireAdmin) ────────────────────────────────────────────────
async function listCoupons(req, res, next) {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        return res.json({ success: true, coupons });
    } catch (e) {
        next(e);
    }
}

async function createCoupon(req, res, next) {
    try {
        const { code, type, value, description, maxDiscount, minCartValue, usageLimit, expiresAt, active } = req.body || {};
        if (!code || !type || value === undefined)
            return res.status(400).json({ success: false, message: "code, type and value are required." });
        if (!["percent", "flat"].includes(type))
            return res.status(400).json({ success: false, message: "type must be 'percent' or 'flat'." });
        const exists = await Coupon.findOne({ code: String(code).toUpperCase() });
        if (exists) return res.status(409).json({ success: false, message: "A coupon with this code already exists." });
        const coupon = await Coupon.create({
            code: String(code).toUpperCase().trim(),
            type,
            value: Number(value),
            description: description || "",
            maxDiscount: Number(maxDiscount) || 0,
            minCartValue: Number(minCartValue) || 0,
            usageLimit: Number(usageLimit) || 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            active: active !== false,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, coupon });
    } catch (e) {
        next(e);
    }
}

async function updateCoupon(req, res, next) {
    try {
        const allowed = ["description", "type", "value", "maxDiscount", "minCartValue", "usageLimit", "expiresAt", "active"];
        const set = {};
        for (const k of allowed) if (req.body[k] !== undefined) set[k] = k === "expiresAt" ? (req.body[k] ? new Date(req.body[k]) : null) : req.body[k];
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: set }, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });
        return res.json({ success: true, coupon });
    } catch (e) {
        next(e);
    }
}

async function deleteCoupon(req, res, next) {
    try {
        const removed = await Coupon.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ success: false, message: "Coupon not found." });
        return res.json({ success: true, message: "Coupon deleted." });
    } catch (e) {
        next(e);
    }
}

module.exports = { applyCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon };
