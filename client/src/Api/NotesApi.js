import api from "./axios";

export const getNotes = async (params) => {
    const { data } = await api.get("/notes", { params });
    return data;
};

export const getNotesFilters = async () => {
    const { data } = await api.get("/notes/filters");
    return data;
};

export const summarizeNote = async (id) => {
    const { data } = await api.post(`/notes/${id}/summary`);
    return data;
};

export const generateFlashcards = async (id, count = 6) => {
    const { data } = await api.post(`/notes/${id}/flashcards`, { count });
    return data;
};
