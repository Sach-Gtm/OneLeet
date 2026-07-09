import api from "./axios";

// Normalises axios errors so callers can `catch (err) { err.message }` and also
// read `err.errors` (array of field messages from the zod validator).
const unwrap = (error) => {
    if (error.response && error.response.data) {
        const data = error.response.data;
        const message =
            data.message ||
            (Array.isArray(data.errors) && data.errors[0]) ||
            "Something went wrong";
        const e = new Error(message);
        e.errors = data.errors;
        e.status = error.response.status;
        throw e;
    }
    throw new Error("Network error or API is unavailable.");
};

export const registerUser = async (payload) => {
    try {
        const { data } = await api.post("/auth/register", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const loginUser = async (payload) => {
    try {
        const { data } = await api.post("/auth/login", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const getMe = async () => {
    const { data } = await api.get("/auth/me");
    return data;
};

export const forgotPassword = async (payload) => {
    try {
        const { data } = await api.post("/auth/forgot-password", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const resetPassword = async (token, payload) => {
    try {
        const { data } = await api.post(`/auth/reset-password/${token}`, payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const loginwithGoogle = async (formData) => {
    try {
        const { data } = await api.post("/auth/google-login", formData);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const updateProfile = async (payload) => {
    try {
        const { data } = await api.patch("/auth/me", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const changePassword = async (payload) => {
    try {
        const { data } = await api.post("/auth/change-password", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    try {
        const { data } = await api.post("/auth/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const logoutUser = async () => {
    try {
        const { data } = await api.post("/auth/logout");
        return data;
    } catch (error) {
        unwrap(error);
    }
};
