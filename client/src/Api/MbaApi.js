import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// Has the logged-in user registered for the OneLeet MBA batch (and with which
// college)? Returns { registered, college }.
export const getMbaStatus = async () => {
    try {
        const { data } = await api.get("/mba/status");
        return { registered: !!data.registered, college: data.college || "" };
    } catch (error) {
        unwrap(error);
    }
};

// Register for the OneLeet MBA batch by picking a college. Returns { registered, college }.
export const registerMba = async ({ college, phone } = {}) => {
    try {
        const { data } = await api.post("/mba/register", { college, phone });
        return { registered: !!data.registered, college: data.college || college || "" };
    } catch (error) {
        unwrap(error);
    }
};

// Admin: the full MBA batch registration list.
export const adminListMbaRegistrations = async () => {
    try {
        const { data } = await api.get("/mba/admin");
        return data.registrations || [];
    } catch (error) {
        unwrap(error);
    }
};
