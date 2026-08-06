import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// --- Orders (admin) ---
export const adminListOrders = async (params = {}) => {
    try {
        const { data } = await api.get("/payments/admin/orders", { params });
        return data.orders || [];
    } catch (error) {
        unwrap(error);
    }
};

// Manually confirm a payment (the UPI flow until Razorpay is wired).
export const adminConfirmOrder = async (id, installmentN) => {
    try {
        const { data } = await api.post(`/payments/admin/orders/${id}/confirm`, installmentN ? { installmentN } : {});
        return data.order;
    } catch (error) {
        unwrap(error);
    }
};

// Re-enable a lapsed split order so the student can pay the second installment.
export const adminReopenOrder = async (id) => {
    try {
        const { data } = await api.post(`/payments/admin/orders/${id}/reopen`);
        return data.order;
    } catch (error) {
        unwrap(error);
    }
};

// Superadmin premium lock/unlock/grant. body: { plan?, premiumLocked?, premiumUntil? }
export const adminSetPremium = async (userId, body) => {
    try {
        const { data } = await api.patch(`/payments/admin/premium/${userId}`, body);
        return data.user;
    } catch (error) {
        unwrap(error);
    }
};

// --- Coupons (admin) ---
export const adminListCoupons = async () => {
    try {
        const { data } = await api.get("/coupons");
        return data.coupons || [];
    } catch (error) {
        unwrap(error);
    }
};

export const adminCreateCoupon = async (body) => {
    try {
        const { data } = await api.post("/coupons", body);
        return data.coupon;
    } catch (error) {
        unwrap(error);
    }
};

export const adminDeleteCoupon = async (id) => {
    try {
        const { data } = await api.delete(`/coupons/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
