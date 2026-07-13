import api from "./axios";

const unwrap = (error) => {
    const msg = error.response?.data?.message || "Something went wrong. Please try again.";
    throw new Error(msg);
};

export const submitBug = async (formData) => {
    try {
        const { data } = await api.post("/contact/bug", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (e) {
        unwrap(e);
    }
};

export const submitContribution = async (formData) => {
    try {
        const { data } = await api.post("/contact/contribution", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (e) {
        unwrap(e);
    }
};

export const submitCallback = async (payload) => {
    try {
        const { data } = await api.post("/contact/callback", payload);
        return data;
    } catch (e) {
        unwrap(e);
    }
};

// ---- Admin inbox (staff only) ----
export const getInbox = async ({ type = "", page = 1 } = {}) => {
    try {
        const { data } = await api.get("/contact/inbox", { params: { type, page } });
        return data;
    } catch (e) {
        unwrap(e);
    }
};

export const markInboxRead = async (id, read = true) => {
    try {
        const { data } = await api.patch(`/contact/inbox/${id}/read`, { read });
        return data;
    } catch (e) {
        unwrap(e);
    }
};

export const deleteInboxItem = async (id) => {
    try {
        const { data } = await api.delete(`/contact/inbox/${id}`);
        return data;
    } catch (e) {
        unwrap(e);
    }
};
