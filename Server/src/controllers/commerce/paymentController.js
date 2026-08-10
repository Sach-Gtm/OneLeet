const Order = require("../../models/orderModel");
const Course = require("../../models/courseModel");
const Coupon = require("../../models/couponModel");
const User = require("../../models/userModel");
const gateway = require("../../services/paymentGateway");
const svc = require("../../services/paymentService");

// Shape an order for the client (hide nothing sensitive — it's the buyer's own).
const publicOrder = (o) => ({
    _id: o._id,
    items: o.items,
    subtotal: o.subtotal,
    cartDiscount: o.cartDiscount,
    cartDiscountPct: o.cartDiscountPct,
    couponCode: o.couponCode,
    couponDiscount: o.couponDiscount,
    baseTotal: o.baseTotal,
    surchargePct: o.surchargePct,
    payable: o.payable,
    amountPaid: o.amountPaid,
    paymentPlan: o.paymentPlan,
    installments: o.installments,
    status: o.status,
    grantsPremiumUntil: o.grantsPremiumUntil,
    referralCode: o.referralCode,
    createdAt: o.createdAt,
});

// POST /api/payments/orders — create a pending order from a cart.
// body: { slugs: [String], plan: "full"|"split", couponCode?, referralCode?,
//         acceptedTerms: { terms, successPromise, noRefund } }
async function createOrder(req, res, next) {
    try {
        const { slugs, plan = "full", couponCode = "", referralCode = "", acceptedTerms = {} } = req.body || {};
        if (!Array.isArray(slugs) || slugs.length === 0)
            return res.status(400).json({ success: false, message: "Add at least one course to your cart." });
        if (!["full", "split"].includes(plan))
            return res.status(400).json({ success: false, message: "Invalid payment plan." });
        // All three consents are mandatory before an order can be created.
        if (!acceptedTerms.terms || !acceptedTerms.successPromise || !acceptedTerms.noRefund)
            return res.status(400).json({ success: false, message: "Please accept the Terms, Success Promise and Refund policy to continue." });

        // Resolve + de-dupe courses (published only). Price is taken from the DB,
        // never the client, so the total can't be tampered with.
        const uniqueSlugs = [...new Set(slugs.map((s) => String(s).toLowerCase()))];
        const courses = await Course.find({ slug: { $in: uniqueSlugs }, published: true }).lean();
        if (courses.length !== uniqueSlugs.length)
            return res.status(404).json({ success: false, message: "One or more courses are unavailable." });

        const items = courses.map((c) => ({
            course: c._id,
            courseSlug: c.slug,
            courseName: c.name,
            examCode: c.examCode || "",
            price: c.price || 0,
        }));
        const validityDays = Math.max(...courses.map((c) => c.validityDays || 365), 365);

        // Validate + resolve a coupon against the post-cart-discount total.
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
            if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon code." });
            const afterCart = items.reduce((s, i) => s + i.price, 0) -
                Math.min(Math.round((items.reduce((s, i) => s + i.price, 0) * svc.cartExtraOff(items.length)) / 100), svc.CART_CAP);
            const bad = coupon.reasonUnusable(afterCart);
            if (bad) return res.status(400).json({ success: false, message: bad });
        }

        const money = svc.computeMoney(items, { plan, coupon });
        const installments = svc.buildInstallments(plan, money.payable);

        const order = await Order.create({
            user: req.user._id,
            items,
            ...money,
            paymentPlan: plan,
            installments,
            validityDays,
            couponCode: coupon ? coupon.code : "",
            referralCode: referralCode ? String(referralCode).toUpperCase() : "",
            acceptedTerms: {
                terms: true,
                successPromise: true,
                noRefund: true,
                acceptedAt: new Date(),
            },
            status: "created",
        });

        // Open a gateway order for the first installment (manual id until wired).
        const g = await gateway.createGatewayOrder({
            amountRupees: installments[0].amount,
            receipt: String(order._id),
            notes: { userId: String(req.user._id) },
        });
        order.installments[0].gatewayOrderId = g.id;
        order.gateway.orderId = g.id;
        await order.save();

        return res.status(201).json({
            success: true,
            order: publicOrder(order),
            gateway: { orderId: g.id, keyId: g.keyId || gateway.KEY_ID, amount: installments[0].amount, live: g.live },
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/payments/orders/me — the buyer's orders (newest first).
async function myOrders(req, res, next) {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        for (const o of orders) await svc.lockIfLapsed(o); // eslint-disable-line no-await-in-loop
        return res.json({ success: true, orders: orders.map(publicOrder) });
    } catch (e) {
        next(e);
    }
}

// GET /api/payments/orders/:id — one of the buyer's own orders.
async function getOrder(req, res, next) {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        await svc.lockIfLapsed(order);
        return res.json({ success: true, order: publicOrder(order) });
    } catch (e) {
        next(e);
    }
}

// POST /api/payments/orders/:id/pay — open a gateway order for the next unpaid
// installment (used for the split second installment). Manual mode returns a
// flag so the UI can tell the student to pay via the team.
async function payInstallment(req, res, next) {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        if (order.status === "locked") return res.status(409).json({ success: false, message: "This installment has lapsed. Please contact support to reopen it." });
        const inst = order.nextInstallment();
        if (!inst) return res.status(400).json({ success: false, message: "This order is fully paid." });

        const g = await gateway.createGatewayOrder({ amountRupees: inst.amount, receipt: `${order._id}-${inst.n}` });
        inst.gatewayOrderId = g.id;
        await order.save();
        return res.json({ success: true, installmentN: inst.n, gateway: { orderId: g.id, keyId: g.keyId || gateway.KEY_ID, amount: inst.amount, live: g.live } });
    } catch (e) {
        next(e);
    }
}

// POST /api/payments/verify — LIVE gateway callback. Verifies Razorpay's
// signature, then marks the installment paid (grants/extends premium). This is
// the only student-facing path that can confirm a payment, and only with a valid
// signature — so it's inert until real keys are set.
async function verifyPayment(req, res, next) {
    try {
        const { orderId, installmentN = 1, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        const ok = gateway.verifyPaymentSignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });
        if (!ok) return res.status(400).json({ success: false, message: "Payment could not be verified." });

        order.gateway.paymentId = razorpay_payment_id || "";
        order.gateway.signature = razorpay_signature || "";
        await svc.markInstallmentPaid(order, Number(installmentN) || 1, {
            paymentId: razorpay_payment_id,
            gatewayOrderId: razorpay_order_id,
        });
        return res.json({ success: true, order: publicOrder(order) });
    } catch (e) {
        next(e);
    }
}

// POST /api/payments/webhook — Razorpay server-to-server confirmation. Verified
// by the webhook signature (NOT a user token), so it confirms a payment even if
// the buyer closed the tab before the /verify callback ran. Idempotent: it only
// marks an installment that isn't already paid, and markInstallmentPaid is a
// no-op on an already-paid installment.
async function webhook(req, res) {
    try {
        const signature = req.headers["x-razorpay-signature"];
        // The raw request bytes (captured in app.js) are what the signature is
        // computed over — re-stringifying the parsed body would not match.
        const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
        if (!gateway.verifyWebhookSignature(raw, signature)) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature." });
        }
        const event = req.body?.event || "";
        const payment = req.body?.payload?.payment?.entity;
        const orderEntity = req.body?.payload?.order?.entity;
        const gatewayOrderId = payment?.order_id || orderEntity?.id || "";
        if ((event === "payment.captured" || event === "order.paid") && gatewayOrderId) {
            const order = await Order.findOne({ "installments.gatewayOrderId": gatewayOrderId });
            if (order) {
                const inst = order.installments.find((i) => i.gatewayOrderId === gatewayOrderId);
                if (inst && inst.status !== "paid") {
                    await svc.markInstallmentPaid(order, inst.n, { paymentId: payment?.id || "", gatewayOrderId });
                }
            }
        }
        // 200 so Razorpay marks the event delivered (idempotent, so re-delivery is safe).
        return res.json({ success: true, received: true });
    } catch (e) {
        // Unexpected failure: 500 so Razorpay retries the webhook later.
        return res.status(500).json({ success: false });
    }
}

// ── Admin ──────────────────────────────────────────────────────────────────

// POST /api/payments/admin/orders/:id/confirm — manual confirm (UPI/bank), the
// path used until Razorpay is wired. body: { installmentN? }
async function adminConfirm(req, res, next) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        const n = Number(req.body?.installmentN) || (order.nextInstallment()?.n ?? 1);
        await svc.markInstallmentPaid(order, n, { paymentId: `manual-${Date.now()}` });
        return res.json({ success: true, order: publicOrder(order) });
    } catch (e) {
        next(e);
    }
}

// POST /api/payments/admin/orders/:id/reopen — re-enable a lapsed split order.
async function adminReopen(req, res, next) {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        await svc.reopenOrder(order);
        return res.json({ success: true, order: publicOrder(order) });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
}

// GET /api/payments/admin/orders — all orders (filter by status/user).
async function adminListOrders(req, res, next) {
    try {
        const q = {};
        if (req.query.status) q.status = req.query.status;
        if (req.query.userId) q.user = req.query.userId;
        const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).populate("user", "name email plan");
        for (const o of orders) await svc.lockIfLapsed(o); // eslint-disable-line no-await-in-loop
        return res.json({
            success: true,
            orders: orders.map((o) => ({ ...publicOrder(o), user: o.user })),
        });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/payments/admin/premium/:userId — superadmin lock/unlock/grant.
// body: { plan?, premiumLocked?, premiumUntil? }
async function adminSetPremium(req, res, next) {
    try {
        const { plan, premiumLocked, premiumUntil } = req.body || {};
        const set = {};
        if (plan && ["free", "pro"].includes(plan)) set.plan = plan;
        if (typeof premiumLocked === "boolean") set.premiumLocked = premiumLocked;
        if (premiumUntil !== undefined) set.premiumUntil = premiumUntil ? new Date(premiumUntil) : null;
        if (Object.keys(set).length === 0)
            return res.status(400).json({ success: false, message: "Nothing to update." });
        const user = await User.findByIdAndUpdate(req.params.userId, { $set: set }, { new: true })
            .select("name email plan premiumUntil premiumLocked");
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        return res.json({ success: true, user });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    createOrder, myOrders, getOrder, payInstallment, verifyPayment, webhook,
    adminConfirm, adminReopen, adminListOrders, adminSetPremium,
};
