import api from "./axios";

export const createQuestion = async (payload) => {
    try {
        const { data } = await api.post("/questions", payload);
        return data;
    } catch (e) {
        throw new Error(e.response?.data?.message || "Could not add the question");
    }
};

export const getQuestions = async (params) => {
    const { data } = await api.get("/questions", { params });
    return data;
};
