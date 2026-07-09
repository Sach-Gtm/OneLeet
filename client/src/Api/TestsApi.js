import api from "./axios";

export const listTests = async () => {
    const { data } = await api.get("/tests");
    return data;
};

export const getTest = async (id) => {
    const { data } = await api.get(`/tests/${id}`);
    return data;
};

export const submitTest = async (id, payload) => {
    const { data } = await api.post(`/tests/${id}/submit`, payload);
    return data;
};

export const listAttempts = async () => {
    const { data } = await api.get("/attempts");
    return data;
};

export const getAttempt = async (id) => {
    const { data } = await api.get(`/attempts/${id}`);
    return data;
};
