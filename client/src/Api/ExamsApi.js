import api from "./axios";

// The LEET exam catalog rarely changes within a session, so cache it.
let cache = null;

export const getExams = async () => {
    if (cache) return cache;
    const { data } = await api.get("/exams");
    cache = data.exams || [];
    return cache;
};

// Drop the cache so pickers refetch after an admin edits the catalog.
export const clearExamsCache = () => {
    cache = null;
};
