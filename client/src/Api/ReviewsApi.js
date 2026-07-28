import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// PUBLIC — the landing-page strip fetches this (no auth needed).
export const getReviews = async () => {
    try {
        const { data } = await api.get("/reviews");
        return data.reviews || [];
    } catch (error) {
        unwrap(error);
    }
};

// --- Admin management ---
export const createReview = async (payload) => {
    try {
        const { data } = await api.post("/reviews", payload);
        return data.review;
    } catch (error) {
        unwrap(error);
    }
};

export const deleteReview = async (id) => {
    try {
        const { data } = await api.delete(`/reviews/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
