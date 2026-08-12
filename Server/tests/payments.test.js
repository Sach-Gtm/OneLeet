// Payments: cart math (whole-cart tier, ₹1000 cap), coupons, split-payment
// schedule + surcharge, premium grant/lock/expiry, admin confirm/reopen, and
// referral conversions. Run: node tests/payments.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.RAZORPAY_KEY_ID; // ensure "manual" mode

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const Course = require("../src/models/courseModel");
const Order = require("../src/models/orderModel");
const Enrollment = require("../src/models/enrollmentModel");
const Referral = require("../src/models/referralModel");
const { isPremiumUser } = require("../src/config/roles");
const svc = require("../src/services/paymentService");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];
const DAY = 86400000;

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const superadmin = await User.create({ name: "Root", email: "root@t.com", password: "secret123", phone: "9000000000", role: "superadmin", isVerified: true, authProvider: "local" });
    const admin = await User.create({ name: "Adm", email: "a@t.com", password: "secret123", phone: "9000000001", role: "admin", isVerified: true, authProvider: "local" });
    const rahul = await User.create({ name: "Rahul Kumar", email: "rahul@t.com", password: "secret123", phone: "9000000003", role: "student", isVerified: true, authProvider: "local" });
    const priya = await User.create({ name: "Priya", email: "priya@t.com", password: "secret123", phone: "9000000004", role: "student", isVerified: true, authProvider: "local" });
    const superT = generateToken(superadmin._id);
    const adminT = generateToken(admin._id);
    const rahulT = generateToken(rahul._id);
    const priyaT = generateToken(priya._id);

    // Two published paid batches.
    const ipu = await Course.create({ name: "IPU LEET 2027", slug: "ipu-leet-2027", examCode: "ipu-leet", examName: "IPU LEET", price: 999, mrp: 8999, validityDays: 365, published: true, createdBy: admin._id });
    const dtu = await Course.create({ name: "DTU LEET 2027", slug: "dtu-leet-2027", examCode: "dtu-nsut-leet", examName: "DTU", price: 799, mrp: 7999, validityDays: 365, published: true, createdBy: admin._id });

    // ── 1. Money math: whole-cart tier + ₹1000 cap + split surcharge ──
    const single = svc.computeMoney([{ price: 999 }], { plan: "full" });
    assert.strictEqual(single.cartDiscount, 0, "one course → no tier discount");
    assert.strictEqual(single.payable, 999, "full plan payable = price");
    const two = svc.computeMoney([{ price: 999 }, { price: 799 }], { plan: "full" });
    assert.strictEqual(two.cartDiscountPct, 20, "2 courses → 20% tier");
    assert.strictEqual(two.cartDiscount, Math.round(1798 * 0.2), "20% of the WHOLE cart");
    const big = svc.computeMoney([{ price: 1499 }, { price: 999 }, { price: 999 }, { price: 999 }, { price: 999 }], { plan: "full" });
    assert.strictEqual(big.cartDiscountPct, 50, "5 courses → 50% tier");
    assert.strictEqual(big.cartDiscount, 1000, "discount capped at ₹1000");
    const split = svc.computeMoney([{ price: 1000 }], { plan: "split" });
    assert.strictEqual(split.surchargePct, 30, "split adds 30% surcharge");
    assert.strictEqual(split.payable, 1300, "split payable = base × 1.30");
    ok("cart math: whole-cart tier %, ₹1000 cap, 30% split surcharge");

    // ── 2. createOrder requires all three consents ──
    const noTicks = await request.post("/api/payments/orders").set(...auth(rahulT))
        .send({ slugs: ["ipu-leet-2027"], plan: "full", acceptedTerms: { terms: true, successPromise: false, noRefund: true } });
    assert.strictEqual(noTicks.status, 400, "missing a consent tick is rejected");
    ok("checkout blocks until Terms + Success Promise + Refund are all accepted");

    // ── 3. Full order → admin confirm → premium granted + enrolled ──
    const ok3 = { terms: true, successPromise: true, noRefund: true };
    const created = await request.post("/api/payments/orders").set(...auth(rahulT))
        .send({ slugs: ["ipu-leet-2027"], plan: "full", acceptedTerms: ok3 });
    assert.strictEqual(created.status, 201, "order created");
    assert.strictEqual(created.body.order.status, "created", "starts unpaid");
    assert.strictEqual(created.body.order.payable, 999, "server price used, not client");
    assert.strictEqual(created.body.gateway.live, false, "manual mode (no Razorpay keys)");
    const orderId = created.body.order._id;

    // Student cannot self-confirm; only admin (manual) can, until Razorpay wired.
    assert.strictEqual((await request.post(`/api/payments/admin/orders/${orderId}/confirm`).set(...auth(rahulT)).send({})).status, 403, "student can't confirm payments");
    const confirmed = await request.post(`/api/payments/admin/orders/${orderId}/confirm`).set(...auth(adminT)).send({});
    assert.strictEqual(confirmed.status, 200, "admin confirms the manual payment");
    assert.strictEqual(confirmed.body.order.status, "paid", "order is paid");

    const rahulAfter = await User.findById(rahul._id).lean();
    assert.strictEqual(rahulAfter.plan, "pro", "buyer upgraded to pro");
    assert.ok(rahulAfter.premiumUntil && new Date(rahulAfter.premiumUntil).getTime() > Date.now() + 300 * DAY, "premium ~1 year out");
    assert.ok(rahulAfter.exams.includes("ipu-leet"), "buyer enrolled → exam-code cached");
    assert.ok(await Enrollment.findOne({ student: rahul._id, course: ipu._id }), "enrollment row created");
    assert.ok(isPremiumUser(rahulAfter), "isPremiumUser true after purchase");
    ok("full payment: admin-confirm grants pro + enrolls + syncs exams");

    // ── 4. isPremiumUser respects lock + expiry ──
    assert.strictEqual(isPremiumUser({ plan: "pro", premiumLocked: true }), false, "admin lock denies premium");
    assert.strictEqual(isPremiumUser({ plan: "pro", premiumUntil: new Date(Date.now() - DAY) }), false, "lapsed premiumUntil denies");
    assert.strictEqual(isPremiumUser({ role: "teacher" }), true, "staff always premium");
    ok("premium gate honours admin lock, expiry, and staff bypass");

    // ── 5. Split payment is retired: the API coerces any split request to full ──
    const coerced = await request.post("/api/payments/orders").set(...auth(priyaT))
        .send({ slugs: ["ipu-leet-2027"], plan: "split", acceptedTerms: ok3 });
    assert.strictEqual(coerced.status, 201);
    assert.strictEqual(coerced.body.order.paymentPlan, "full", "a split request is coerced to a full order");
    assert.strictEqual(coerced.body.order.installments.length, 1, "full order has a single installment");
    assert.strictEqual(coerced.body.order.payable, 999, "full payable = base (no 30% surcharge)");
    ok("split payment retired: the API coerces split → full");

    // C1: /verify must bind razorpay_order_id to THIS order's installment, so a
    // valid signature from an unrelated (cheaper) payment can't confirm this one.
    // The binding check runs before signature verification, so it holds even in
    // test mode (no live keys).
    const badBind = await request.post("/api/payments/verify").set(...auth(priyaT)).send({
        orderId: coerced.body.order._id,
        installmentN: 1,
        razorpay_order_id: "order_UNRELATED",
        razorpay_payment_id: "pay_x",
        razorpay_signature: "sig_x",
    });
    assert.strictEqual(badBind.status, 400, "verify rejects a razorpay_order_id that isn't this order's gateway order");
    assert.match(String(badBind.body.message || ""), /does not match/i, "…via the order-binding check, before any signature verification");
    ok("payment verify binds the gateway order id to the order (no cross-order signature replay)");

    // ── 5b. Legacy split orders still complete: 30+3 window on first, full validity on second ──
    const splitOrder0 = await Order.create({
        user: priya._id,
        items: [{ course: dtu._id, courseSlug: "dtu-leet-2027", courseName: "DTU", examCode: "dtu-nsut-leet", price: 799 }],
        subtotal: 799, baseTotal: 799, payable: 1039, surchargePct: 30, paymentPlan: "split", validityDays: 365,
        installments: [{ n: 1, amount: 520, status: "pending" }, { n: 2, amount: 519, status: "pending" }],
        status: "created",
    });
    const splitId = splitOrder0._id;

    await request.post(`/api/payments/admin/orders/${splitId}/confirm`).set(...auth(adminT)).send({ installmentN: 1 });
    let splitOrder = await Order.findById(splitId);
    assert.strictEqual(splitOrder.status, "partially_paid", "after 1st installment: partially paid");
    const window = new Date(splitOrder.grantsPremiumUntil).getTime() - Date.now();
    assert.ok(window > 32 * DAY && window < 34 * DAY, "1st installment opens a 30+3 day window");
    let priyaMid = await User.findById(priya._id).lean();
    assert.ok(isPremiumUser(priyaMid), "premium active during the window");

    await request.post(`/api/payments/admin/orders/${splitId}/confirm`).set(...auth(adminT)).send({ installmentN: 2 });
    splitOrder = await Order.findById(splitId);
    assert.strictEqual(splitOrder.status, "paid", "after 2nd installment: fully paid");
    const full = new Date(splitOrder.grantsPremiumUntil).getTime() - Date.now();
    assert.ok(full > 360 * DAY, "2nd installment extends to full validity");
    ok("split payment: 30+3 window on first, full validity on second");

    // ── 6. Split lapse → lock; admin reopen ──
    const lapse = await Order.create({
        user: priya._id, items: [{ course: dtu._id, courseSlug: "dtu-leet-2027", courseName: "DTU", examCode: "dtu-nsut-leet", price: 799 }],
        subtotal: 799, baseTotal: 799, payable: 1039, paymentPlan: "split", validityDays: 365,
        installments: [
            { n: 1, amount: 520, status: "paid", paidAt: new Date(Date.now() - 40 * DAY) },
            { n: 2, amount: 519, status: "pending", dueAt: new Date(Date.now() - 10 * DAY), graceUntil: new Date(Date.now() - 7 * DAY) },
        ],
        firstPaidAt: new Date(Date.now() - 40 * DAY), status: "partially_paid",
    });
    await svc.lockIfLapsed(lapse);
    assert.strictEqual((await Order.findById(lapse._id)).status, "locked", "past-grace split order locks");
    const reopened = await request.post(`/api/payments/admin/orders/${lapse._id}/reopen`).set(...auth(adminT)).send({});
    assert.strictEqual(reopened.status, 200, "admin reopens a locked order");
    assert.strictEqual(reopened.body.order.status, "partially_paid", "reopened → payable again");
    ok("split lapse locks premium; admin reopen re-enables the second payment");

    // ── 7. Coupons: admin create, student preview, applied in order ──
    const mkCoupon = await request.post("/api/coupons").set(...auth(adminT))
        .send({ code: "leet100", type: "flat", value: 100, description: "₹100 off" });
    assert.strictEqual(mkCoupon.status, 201, "admin creates a coupon (code upper-cased)");
    assert.strictEqual(mkCoupon.body.coupon.code, "LEET100");
    const preview = await request.post("/api/coupons/apply").set(...auth(rahulT)).send({ code: "leet100", cartTotal: 999 });
    assert.strictEqual(preview.body.discount, 100, "flat coupon previews ₹100 off");
    const withCoupon = await request.post("/api/payments/orders").set(...auth(rahulT))
        .send({ slugs: ["dtu-leet-2027"], plan: "full", couponCode: "leet100", acceptedTerms: ok3 });
    assert.strictEqual(withCoupon.body.order.couponDiscount, 100, "coupon applied to the order");
    assert.strictEqual(withCoupon.body.order.payable, 699, "799 − 100 = 699");
    ok("coupons: admin CRUD, checkout preview, applied server-side");

    // ── 8. Referral: code format + reward at 3 conversions ──
    const myRef = await request.get("/api/referrals/me").set(...auth(rahulT));
    assert.strictEqual(myRef.body.referral.code, "RAHU2027", "code = first 4 letters + 2027");
    const ref = await Referral.findOne({ user: rahul._id });
    ref.conversions.push({ referredUser: priya._id }, { referredUser: admin._id }, { referredUser: superadmin._id });
    if (ref.conversions.length >= Referral.REWARD_THRESHOLD) ref.rewardUnlockedAt = new Date();
    await ref.save();
    const after = await request.get("/api/referrals/me").set(...auth(rahulT));
    assert.strictEqual(after.body.referral.rewardUnlocked, true, "reward unlocks at 3 conversions");
    ok("referral: RAHU2027-style code, reward unlocks at 3 conversions");

    // Referral validation at checkout: real code (any case) applies; junk + own code rejected.
    const goodRef = await request.post("/api/referrals/validate").set(...auth(priyaT)).send({ code: "rahu2027" });
    assert.strictEqual(goodRef.body.valid, true, "a real code (any case) validates for another user");
    assert.match(goodRef.body.message, /applied successfully/i, "success message is returned");
    const badRef = await request.post("/api/referrals/validate").set(...auth(priyaT)).send({ code: "NOPE9999" });
    assert.strictEqual(badRef.body.valid, false, "a non-existent code is rejected");
    const selfRef = await request.post("/api/referrals/validate").set(...auth(rahulT)).send({ code: "RAHU2027" });
    assert.strictEqual(selfRef.body.valid, false, "you can't apply your own code");
    ok("referral validate: real code applies, junk + self-referral rejected");

    // ── 9. Admin premium lock/unlock (superadmin only) ──
    assert.strictEqual((await request.patch(`/api/payments/admin/premium/${rahul._id}`).set(...auth(adminT)).send({ premiumLocked: true })).status, 403, "admin (non-super) can't toggle premium");
    const locked = await request.patch(`/api/payments/admin/premium/${rahul._id}`).set(...auth(superT)).send({ premiumLocked: true });
    assert.strictEqual(locked.status, 200, "superadmin locks premium");
    assert.strictEqual(isPremiumUser(await User.findById(rahul._id).lean()), false, "locked buyer loses premium");
    await request.patch(`/api/payments/admin/premium/${rahul._id}`).set(...auth(superT)).send({ premiumLocked: false });
    assert.strictEqual(isPremiumUser(await User.findById(rahul._id).lean()), true, "unlock restores premium");
    ok("superadmin premium lock/unlock kill-switch works");

    console.log(`\n✅ All ${passed} payment checks passed`);
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
})().catch((e) => { console.error("❌", e); process.exit(1); });
