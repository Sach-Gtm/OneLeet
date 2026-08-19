import api from "./axios";

// Register a candidate for the All-India Scholarship Test. Public endpoint —
// the backend also auto-creates/links a website account with the same details.
export const registerScholarship = async (payload) => {
    try {
        const { data } = await api.post("/scholarship/register", payload);
        return data;
    } catch (error) {
        const e = new Error(error.response?.data?.message || "Something went wrong. Please try again.");
        e.status = error.response?.status;
        throw e;
    }
};
