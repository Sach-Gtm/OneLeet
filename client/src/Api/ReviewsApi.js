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
// Multipart: a video review carries an uploaded clip and an image review an
// uploaded photo/screenshot; text reviews just fields.
export const createReview = async ({ type, text, title, author, video, image }) => {
    try {
        const form = new FormData();
        form.append("type", type);
        if (text) form.append("text", text);
        if (title) form.append("title", title);
        if (author) form.append("author", author);
        if (video) form.append("video", video);
        if (image) form.append("image", image);
        const { data } = await api.post("/reviews", form);
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
