import api from "./axios";

// Apply to the OneLeet Campus Ambassador Program. Public endpoint — the backend
// stores the application (idempotent per email) for staff to review.
export const applyAmbassador = async (payload) => {
    try {
        const { data } = await api.post("/ambassador/apply", payload);
        return data;
    } catch (error) {
        const e = new Error(error.response?.data?.message || "Something went wrong. Please try again.");
        e.status = error.response?.status;
        throw e;
    }
};
