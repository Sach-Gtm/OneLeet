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
