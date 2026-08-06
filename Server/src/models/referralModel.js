const mongoose = require("mongoose");

// A student's referral code + the premium conversions credited to it. The code
// is the founder's format: the first four letters of the name + "2027"
// (e.g. RAHU2027), with a numeric suffix on collision so it stays unique. The
// reward unlocks at 3 successful premium conversions (special merch + a 1:1 with
// the founder).
const REWARD_THRESHOLD = 3;

const ConversionSchema = new mongoose.Schema(
    {
        referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        amount: { type: Number, default: 0 }, // order total that converted
        at: { type: Date, default: Date.now },
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

module.exports = mongoose.model("Referral", ReferralSchema);
module.exports.REWARD_THRESHOLD = REWARD_THRESHOLD;
