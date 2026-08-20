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

// Live social-proof tally of scholarship registrations (already inflated ×3 by
// the API). Returns a number; 0 on any failure so the UI can fall back quietly.
export const getScholarshipCount = async () => {
    try {
        const { data } = await api.get("/scholarship/count");
        return Number(data?.count) || 0;
    } catch {
        return 0;
    }
};

// Has the logged-in user already registered for the scholarship test? Returns a
// boolean; false on any failure (e.g. not logged in) so the UI stays safe.
export const getScholarshipStatus = async () => {
    try {
        const { data } = await api.get("/scholarship/status");
        return !!data?.registered;
    } catch {
        return false;
    }
};
