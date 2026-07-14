import api from "./axios";

export const getAiStatus = async () => {
    const { data } = await api.get("/ai/status");
    return data;
};

// Most-searched topics on OneLeet in the last 24h (topic names only).
export const getTrending = async () => {
    const { data } = await api.get("/ai/trending");
    return data.topics || [];
};

export const generateQuestions = async (payload) => {
    const { data } = await api.post("/ai/questions", payload);
    return data;
};

export const predictDifficulty = async (payload) => {
    const { data } = await api.post("/ai/predict-difficulty", payload);
    return data;
};

export const analyzePerformance = async () => {
    const { data } = await api.post("/ai/analyze");
    return data;
};

export const generateStudyPlan = async (payload) => {
    const { data } = await api.post("/ai/study-plan", payload);
    return data;
};
