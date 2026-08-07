import api from "./axios";

// `exam` scopes the list to one batch (its targeted tests + universal content),
// and the "attempted" flags to attempts taken under that batch.
export const listTests = async (exam) => {
    const { data } = await api.get("/tests", { params: exam ? { exam } : {} });
    return data;
};

// `exam` is the batch context — a universal test is single-attempt per batch.
export const getTest = async (id, exam) => {
    const { data } = await api.get(`/tests/${id}`, { params: exam ? { exam } : {} });
    return data;
};

// payload carries the batch context as examCode so the attempt records it.
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
