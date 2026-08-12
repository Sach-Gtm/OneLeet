import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// --- Orders / checkout ---

// Create a pending order from a cart. payload:
// { slugs, plan: "full"|"split", couponCode?, referralCode?, acceptedTerms }
// Returns { order, gateway } — gateway.live tells the UI whether to open
// Razorpay (live) or show the "our team will confirm" manual notice.
export const createOrder = async (payload) => {
    try {
        const { data } = await api.post("/payments/orders", payload);
        return data; // { order, gateway }
    } catch (error) {
        unwrap(error);
    }
};

export const getMyOrders = async () => {
    try {
        const { data } = await api.get("/payments/orders/me");
        return data.orders || [];
    } catch (error) {
        unwrap(error);
    }
};

// Open a gateway order for the next unpaid installment (split 2nd payment).
export const payInstallment = async (orderId) => {
    try {
        const { data } = await api.post(`/payments/orders/${orderId}/pay`);
        return data; // { installmentN, gateway }
    } catch (error) {
        unwrap(error);
    }
};

// LIVE Razorpay callback — verify the signature and mark the installment paid.
export const verifyPayment = async (payload) => {
    try {
        const { data } = await api.post("/payments/verify", payload);
        return data.order;
    } catch (error) {
        unwrap(error);
    }
};

// --- Coupons ---

// Preview a coupon at checkout: returns { code, discount, description }.
export const applyCoupon = async (code, cartTotal) => {
    try {
        const { data } = await api.post("/coupons/apply", { code, cartTotal });
        return data;
    } catch (error) {
        unwrap(error);
    }
};

// --- Referrals ---

export const getMyReferral = async () => {
    try {
        const { data } = await api.get("/referrals/me");
        return data.referral;
    } catch (error) {
        unwrap(error);
    }
};

// Validate a friend's referral code at checkout → { valid, message, code? }.
export const validateReferral = async (code) => {
    try {
        const { data } = await api.post("/referrals/validate", { code });
        return data;
    } catch (error) {
        unwrap(error);
    }
};
