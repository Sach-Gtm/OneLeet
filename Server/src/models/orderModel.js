const mongoose = require("mongoose");

// A purchase of one or more course batches. This is the payment record: it
// snapshots the cart + the money math + the T&C the student accepted, tracks the
// installment schedule (for Split Payment), and holds the gateway fields that
// Razorpay fills in once wired. Premium is granted (and, for split, later
// locked) off this record — see services/paymentService.

// A purchased line item, snapshotted so later course edits don't rewrite history.
const OrderItemSchema = new mongoose.Schema(
    {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        courseSlug: { type: String, required: true },
        courseName: { type: String, required: true },
        examCode: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 }, // early-bird price at purchase
    },
    { _id: false }
);

// One installment. A full-payment order has a single installment; a split order
// has two. dueAt/graceUntil are set on the *second* installment when the first
// is paid (the 30-day window + 3-day grace runs from that moment).
const InstallmentSchema = new mongoose.Schema(
    {
        n: { type: Number, required: true }, // 1 or 2
        amount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ["pending", "paid"], default: "pending" },
        dueAt: { type: Date, default: null },
        graceUntil: { type: Date, default: null },
        paidAt: { type: Date, default: null },
        // gateway ids per installment (each installment is its own charge)
        gatewayOrderId: { type: String, default: "" },
        gatewayPaymentId: { type: String, default: "" },
    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        items: { type: [OrderItemSchema], required: true },

        // ── money (all in rupees) ──
        subtotal: { type: Number, required: true, min: 0 }, // Σ item prices
        cartDiscount: { type: Number, default: 0, min: 0 }, // whole-cart tier, ₹1000-capped
        cartDiscountPct: { type: Number, default: 0, min: 0 },
        couponCode: { type: String, default: "" },
        couponDiscount: { type: Number, default: 0, min: 0 },
        baseTotal: { type: Number, required: true, min: 0 }, // subtotal − discounts (one-time price)
        surchargePct: { type: Number, default: 0, min: 0 }, // 30 for split, else 0
        payable: { type: Number, required: true, min: 0 }, // what the student actually owes (incl. surcharge)
        amountPaid: { type: Number, default: 0, min: 0 },

        // ── plan & schedule ──
        paymentPlan: { type: String, enum: ["full", "split"], default: "full" },
        installments: { type: [InstallmentSchema], default: [] },
        firstPaidAt: { type: Date, default: null }, // anchors the split window
        validityDays: { type: Number, default: 365 }, // snapshot; full access on completion
        grantsPremiumUntil: { type: Date, default: null }, // what we set on the user

        // ── lifecycle ──
        // created  – awaiting first payment
        // partially_paid – split: first installment paid, second pending
        // paid     – fully paid (premium active for the validity window)
        // cancelled – abandoned/cancelled before completion
        // locked   – split second installment lapsed past grace (admin can reopen)
        status: {
            type: String,
            enum: ["created", "partially_paid", "paid", "cancelled", "locked"],
            default: "created",
            index: true,
        },

        // The three checkout ticks + when they were accepted (evidence of consent).
        acceptedTerms: {
            terms: { type: Boolean, default: false },
            successPromise: { type: Boolean, default: false },
            noRefund: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
        },

        referralCode: { type: String, default: "" }, // code the buyer applied
        referralCredited: { type: Boolean, default: false }, // guard: credit the referrer once

        // Razorpay wiring drops in here. provider defaults to razorpay; ids are
        // empty until the gateway is connected (see services/paymentGateway).
        gateway: {
            provider: { type: String, default: "razorpay" },
            orderId: { type: String, default: "" },
            paymentId: { type: String, default: "" },
            signature: { type: String, default: "" },
        },
    },
    { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });

// The next unpaid installment (or null if fully paid).
OrderSchema.methods.nextInstallment = function () {
    return this.installments.find((i) => i.status === "pending") || null;
};

module.exports = mongoose.model("Order", OrderSchema);
