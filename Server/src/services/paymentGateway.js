const crypto = require("crypto");

// ── Razorpay integration SEAM ──────────────────────────────────────────────
// The founder wires the real Razorpay connection (StaplerLabs account) by
// setting RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in the server env and installing
// the `razorpay` npm package. Until then we run in "manual" mode: orders are
// created and confirmed by an admin (matching the existing UPI/manual flow), and
// NO money moves. Everything else — cart math, T&C capture, split schedule,
// premium grant/lock — is fully built and independent of this file.
//
// To go live (≈ the 3–4 day task):
//   1. npm i razorpay
//   2. set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (+ RAZORPAY_WEBHOOK_SECRET)
//   3. uncomment the `require("razorpay")` block below
//   4. point a Razorpay webhook at POST /api/payments/webhook

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

const isLive = () => Boolean(KEY_ID && KEY_SECRET);

// Create a gateway order for an amount (rupees). Returns { id, live }.
// In manual mode returns a placeholder id and live:false so callers know the
// charge must be confirmed by an admin rather than the gateway.
async function createGatewayOrder({ amountRupees, receipt, notes }) {
    if (!isLive()) {
        return { id: `manual_${receipt || Date.now()}`, live: false, keyId: "" };
    }
    // --- LIVE (uncomment once razorpay is installed + keys set) ---
    // const Razorpay = require("razorpay");
    // const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
    // const order = await rzp.orders.create({
    //     amount: Math.round(amountRupees * 100), // paise
    //     currency: "INR",
    //     receipt: String(receipt || ""),
    //     notes: notes || {},
    // });
    // return { id: order.id, live: true, keyId: KEY_ID };
    throw new Error("Razorpay keys are set but the razorpay client is not installed. See services/paymentGateway.js.");
}

// Verify the checkout signature Razorpay returns after a successful payment.
// HMAC_SHA256(orderId | paymentId, KEY_SECRET) === signature.
function verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!isLive() || !signature) return false;
    const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    // timing-safe compare
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Verify a Razorpay webhook body signature.
function verifyWebhookSignature(rawBody, signature) {
    if (!WEBHOOK_SECRET || !signature) return false;
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { isLive, createGatewayOrder, verifyPaymentSignature, verifyWebhookSignature, KEY_ID };
