import api from "./axios";


export const loginwithGoogle = async (formData) => {
    try {
        const response = await api.post("/auth/google-login", formData);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw new Error("Network error or API is unavailable.");
        }
    }
};

export const logoutUser = async () => {
    try {
        return await api.post("/auth/logout");
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw new Error("Network error or API is unavailable.");
        }
    }
};
