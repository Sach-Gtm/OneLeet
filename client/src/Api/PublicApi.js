import api from "./axios";

// No-login reads backing the marketing EXAMS pages (server: /api/public/*).
// Each returns [] / null on failure so a page can render an empty state.
const get = async (path, fallback) => {
    try {
        return (await api.get(path)).data;
    } catch {
        return fallback;
    }
};

export const getPublicExams = async () => (await get("/public/exams", { exams: [] })).exams || [];
export const getExamOverview = (code) => get(`/public/exams/${code}/overview`, null);
export const getExamPattern = async (code) => (await get(`/public/exams/${code}/pattern`, {})).pattern || null;
export const getExamSyllabus = async (code) => (await get(`/public/exams/${code}/syllabus`, {})).syllabi || [];
export const getExamSeatMatrix = async (code) => (await get(`/public/exams/${code}/seat-matrix`, {})).matrix || null;
export const getExamCutoffs = async (code) => (await get(`/public/exams/${code}/cutoffs`, {})).matrix || null;
export const getExamPyqs = async (code) => (await get(`/public/exams/${code}/pyqs`, {})).pyqs || [];
