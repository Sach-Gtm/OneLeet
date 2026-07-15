import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// Ask the AI to draft an assessment from pasted text (or a topic). Returns a
// draft { title, description, questions[] } — nothing is saved yet.
export const aiDraft = async (payload) => {
    try {
        const { data } = await api.post("/studio/ai-draft", payload);
        return data.draft;
    } catch (error) {
        unwrap(error);
    }
};

export const listStudioTests = async () => {
    try {
        const { data } = await api.get("/studio/tests");
        return data.tests || [];
    } catch (error) {
        unwrap(error);
    }
};

export const getStudioTest = async (id) => {
    try {
        const { data } = await api.get(`/studio/tests/${id}`);
        return data.test;
    } catch (error) {
        unwrap(error);
    }
};

export const createStudioTest = async (payload) => {
    try {
        const { data } = await api.post("/studio/tests", payload);
        return data.test;
    } catch (error) {
        unwrap(error);
    }
};

export const updateStudioTest = async (id, payload) => {
    try {
        const { data } = await api.patch(`/studio/tests/${id}`, payload);
        return data.test;
    } catch (error) {
        unwrap(error);
    }
};

export const publishStudioTest = async (id) => {
    try {
        const { data } = await api.post(`/studio/tests/${id}/publish`);
        return data.test;
    } catch (error) {
        unwrap(error);
    }
};

export const removeStudioTest = async (id) => {
    try {
        const { data } = await api.delete(`/studio/tests/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
