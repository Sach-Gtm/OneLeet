import api from "./axios";

// Students see published syllabi (with their own progress); staff see all.
export const getSyllabi = async () => {
    const { data } = await api.get("/syllabus");
    return data.syllabi || [];
};

// Overall coverage across all published syllabi — used on the dashboard.
export const getSyllabusSummary = async () => {
    const { data } = await api.get("/syllabus/me/summary");
    return data.summary;
};

export const getSyllabus = async (id) => {
    const { data } = await api.get(`/syllabus/${id}`);
    return data.syllabus;
};

// Student marks a topic complete/incomplete; returns the new progress.
export const toggleTopic = async (syllabusId, topicId, done) => {
    const { data } = await api.post(`/syllabus/${syllabusId}/toggle`, { topicId, done });
    return data;
};

// --- Staff authoring ---
export const createSyllabus = async (payload) => {
    const { data } = await api.post("/syllabus", payload);
    return data.syllabus;
};

export const updateSyllabus = async (id, payload) => {
    const { data } = await api.put(`/syllabus/${id}`, payload);
    return data.syllabus;
};

export const deleteSyllabus = async (id) => {
    const { data } = await api.delete(`/syllabus/${id}`);
    return data;
};

// AI-refine pasted syllabus text into chapters/topics (returns a draft).
export const aiDraftSyllabus = async (text, subject) => {
    const { data } = await api.post("/syllabus/ai-draft", { text, subject });
    return data.draft;
};

// Scan an uploaded PDF or image into chapters/topics (returns a draft).
// `prompt` is optional free-text steering ("subject is Thermodynamics", "group
// by unit", etc.) that the AI follows and lets override the source.
export const aiScanSyllabus = async (file, subject, prompt) => {
    const form = new FormData();
    form.append("attachment", file);
    if (subject) form.append("subject", subject);
    if (prompt) form.append("prompt", prompt);
    const { data } = await api.post("/syllabus/ai-scan", form);
    return data.draft;
};
