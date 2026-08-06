const mongoose = require("mongoose");

// Admin-created discount codes applied at checkout. Kept deliberately simple:
// a percent (with an optional rupee cap) or a flat rupee amount, an optional
// expiry / usage cap / minimum cart value. Validation math lives on the schema
// (`discountFor`) so the checkout preview and the order-create path agree.
const CouponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
        description: { type: String, default: "", maxlength: 200 },
        type: { type: String, enum: ["percent", "flat"], required: true },
        value: { type: Number, required: true, min: 0 }, // percent (0–100) or rupees
        maxDiscount: { type: Number, default: 0, min: 0 }, // percent cap in rupees; 0 = no cap
        minCartValue: { type: Number, default: 0, min: 0 },
        usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
        usedCount: { type: Number, default: 0, min: 0 },
        active: { type: Boolean, default: true, index: true },
        expiresAt: { type: Date, default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Why a coupon can't be used right now (null = usable). Pure, no writes.
CouponSchema.methods.reasonUnusable = function (cartTotal) {
    if (!this.active) return "This coupon is not active.";
    if (this.expiresAt && new Date(this.expiresAt).getTime() < Date.now()) return "This coupon has expired.";
    if (this.usageLimit && this.usedCount >= this.usageLimit) return "This coupon has reached its usage limit.";
    if (this.minCartValue && cartTotal < this.minCartValue)
        return `Add ₹${this.minCartValue - cartTotal} more to use this coupon (minimum ₹${this.minCartValue}).`;
    return null;
};

// Rupee discount this coupon yields on a cart total (never more than the total).
CouponSchema.methods.discountFor = function (cartTotal) {
    let d = this.type === "percent" ? Math.round((cartTotal * this.value) / 100) : this.value;
    if (this.type === "percent" && this.maxDiscount) d = Math.min(d, this.maxDiscount);
    return Math.max(0, Math.min(d, cartTotal));
};

module.exports = mongoose.model("Coupon", CouponSchema);
