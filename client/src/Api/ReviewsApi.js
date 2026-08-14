import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// PUBLIC — the Success Wall reads these (no auth).
export const getReviews = async () => {
    try {
        const { data } = await api.get("/reviews");
        return data.reviews || [];
    } catch (error) {
        unwrap(error);
    }
};
export const getCases = async () => {
    try {
        const { data } = await api.get("/reviews/cases");
        return data.cases || [];
    } catch (error) {
        unwrap(error);
    }
};
export const getCase = async (slug) => {
    try {
        const { data } = await api.get(`/reviews/cases/${slug}`);
        return data.case;
    } catch (error) {
        unwrap(error);
    }
};

// --- Admin management ---
export const getReviewsAdmin = async () => {
    try {
        const { data } = await api.get("/reviews/admin/all");
        return data.reviews || [];
    } catch (error) {
        unwrap(error);
    }
};

// Multipart: an image/video review carries an uploaded file; the rest ride as
// fields (arrays/objects aren't used here, so plain appends are fine).
const toForm = (r) => {
    const form = new FormData();
    const scalars = ["type", "text", "title", "author", "exam", "rank", "college", "branch", "caseTitle", "caseStory", "order"];
    scalars.forEach((k) => {
        if (r[k] !== undefined && r[k] !== null && r[k] !== "") form.append(k, r[k]);
    });
    if (r.isCase !== undefined) form.append("isCase", r.isCase ? "true" : "false");
    if (r.published !== undefined) form.append("published", r.published ? "true" : "false");
    if (r.image instanceof File) form.append("image", r.image);
    if (r.video instanceof File) form.append("video", r.video);
    return form;
};

export const createReview = async (review) => {
    try {
        const { data } = await api.post("/reviews", toForm(review));
        return data.review;
    } catch (error) {
        unwrap(error);
    }
};
export const updateReview = async (id, review) => {
    try {
        const { data } = await api.patch(`/reviews/${id}`, toForm(review));
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
