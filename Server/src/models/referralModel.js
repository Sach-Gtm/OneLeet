const mongoose = require("mongoose");

// A student's referral code + the purchases credited to it. The code is the
// founder's format: the first four letters of the name + "2027" (e.g. RAHU2027),
// with a numeric suffix on collision so it stays unique.
//
// Cash reward: when a referred friend pays for a course with this code applied at
// checkout, the referrer earns REWARD_PCT (7%) of the course value. Each payout
// matures PAYOUT_DELAY_DAYS (~1.25 months) after the friend's payment, and the
// OneLeet team pays it out then (tracked per-conversion below).
const REWARD_THRESHOLD = 3;         // legacy: signups needed for the old 1:1 reward
const REWARD_PCT = 7;               // referrer earns 7% of the course value
const PAYOUT_DELAY_DAYS = 38;       // ~1.25 months after the referred student pays

const ConversionSchema = new mongoose.Schema(
    {
        referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        amount: { type: Number, default: 0 },        // course value the friend paid (order total)
        at: { type: Date, default: Date.now },       // when the friend paid (payout clock starts here)
        // ── cash payout tracking ──
        rewardAmount: { type: Number, default: 0 },  // 7% of `amount`, in rupees
        payoutDueAt: { type: Date },                 // `at` + ~1.25 months: when OneLeet should pay
        payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
        paidAt: { type: Date, default: null },       // when the team actually paid the referrer
        payoutNote: { type: String, default: "" },   // e.g. UPI / bank transfer reference
    },
    { _id: false }
);

const ReferralSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
        code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
        conversions: { type: [ConversionSchema], default: [] },
        rewardUnlockedAt: { type: Date, default: null },
        rewardFulfilledAt: { type: Date, default: null }, // admin marks merch/1:1 done
    },
    { timestamps: true }
);

ReferralSchema.virtual("conversionCount").get(function () {
    return this.conversions.length;
});
ReferralSchema.set("toJSON", { virtuals: true });
ReferralSchema.set("toObject", { virtuals: true });

// Build the base code from a name; caller ensures uniqueness against clashes.
ReferralSchema.statics.baseCode = function (name) {
    const letters = String(name || "user").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "USER";
    return `${letters}2027`;
};

// Find-or-create a unique code for a user (numeric suffix on collision).
ReferralSchema.statics.ensureFor = async function (userId, name) {
    const existing = await this.findOne({ user: userId });
    if (existing) return existing;
    const base = this.baseCode(name);
    let code = base;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await this.exists({ code })) {
        code = `${base}${n}`;
        n += 1;
    }
    return this.create({ user: userId, code });
};

ReferralSchema.statics.REWARD_THRESHOLD = REWARD_THRESHOLD;
ReferralSchema.statics.REWARD_PCT = REWARD_PCT;
ReferralSchema.statics.PAYOUT_DELAY_DAYS = PAYOUT_DELAY_DAYS;

module.exports = mongoose.model("Referral", ReferralSchema);
module.exports.REWARD_THRESHOLD = REWARD_THRESHOLD;
module.exports.REWARD_PCT = REWARD_PCT;
module.exports.PAYOUT_DELAY_DAYS = PAYOUT_DELAY_DAYS;
