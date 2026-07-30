import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// STUDENT — paper patterns for the exams the signed-in user picked in profile.
export const getMyExamPatterns = async () => {
    try {
        const { data } = await api.get("/exam-patterns/me");
        return data.patterns || [];
    } catch (error) {
        unwrap(error);
    }
};

// --- Admin management (admins + superadmin) ---
export const getAllExamPatterns = async () => {
    try {
        const { data } = await api.get("/exam-patterns");
        return data.patterns || [];
    } catch (error) {
        unwrap(error);
    }
};

export const createExamPattern = async (payload) => {
    try {
        const { data } = await api.post("/exam-patterns", payload);
        return data.pattern;
    } catch (error) {
        unwrap(error);
    }
};

export const updateExamPattern = async (id, payload) => {
    try {
        const { data } = await api.patch(`/exam-patterns/${id}`, payload);
        return data.pattern;
    } catch (error) {
        unwrap(error);
    }
};

export const deleteExamPattern = async (id) => {
    try {
        const { data } = await api.delete(`/exam-patterns/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
