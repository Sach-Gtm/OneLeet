import api from "./axios";

// Surface the server's message (incl. the friendly quota-exceeded text) and the
// quota snapshot, instead of a raw axios error.
const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    e.quota = data?.quota || null;
    throw e;
};

export const getAiStatus = async () => {
    const { data } = await api.get("/ai/status");
    return data;
};

// The caller's remaining daily AI generations (for the usage meter).
export const getAiQuota = async () => {
    const { data } = await api.get("/ai/quota");
    return data.quota;
};

// Most-searched topics on OneLeet in the last 24h (topic names only).
export const getTrending = async () => {
    const { data } = await api.get("/ai/trending");
    return data.topics || [];
};

export const generateQuestions = async (payload) => {
    try {
        const { data } = await api.post("/ai/questions", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const predictDifficulty = async (payload) => {
    try {
        const { data } = await api.post("/ai/predict-difficulty", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const analyzePerformance = async () => {
    try {
        const { data } = await api.post("/ai/analyze");
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const generateStudyPlan = async (payload) => {
    try {
        const { data } = await api.post("/ai/study-plan", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
