import api from "./axios";

export const getNotes = async (params) => {
    const { data } = await api.get("/notes", { params });
    return data;
};

export const getNotesFilters = async () => {
    const { data } = await api.get("/notes/filters");
    return data;
};

// One note with its full body (used to read a written/AI "text" note).
export const getNote = async (id) => {
    const { data } = await api.get(`/notes/${id}`);
    return data;
};

// Staff: AI-draft note content from a freeform instruction, optionally reading
// an attached image/PDF. Returns a draft; does not save.
export const generateNoteDraft = async ({ prompt, subject, file } = {}) => {
    if (file) {
        const form = new FormData();
        form.append("prompt", prompt || "");
        if (subject) form.append("subject", subject);
        form.append("attachment", file);
        const { data } = await api.post("/notes/generate", form);
        return data;
    }
    const { data } = await api.post("/notes/generate", { prompt, subject });
    return data;
};

// Staff: publish a note. Pass text fields in `fields`; attach an optional PDF
// as `file`. Sent as multipart so the same endpoint handles both modes.
export const uploadNote = async (fields, file) => {
    const form = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => {
        if (v != null && v !== "") form.append(k, String(v));
    });
    if (file) form.append("pdfFile", file);
    // Let axios set the multipart boundary itself — don't hardcode Content-Type.
    const { data } = await api.post("/notes", form);
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
