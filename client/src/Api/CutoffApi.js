import api from "./axios";

// Which exams currently have published cut-offs (to gate the button).
export const getCutoffIndex = async () => {
    try {
        const { data } = await api.get("/cutoffs");
        return data.cutoffs || [];
    } catch {
        return [];
    }
};

// The full round-wise cut-off matrix for one exam.
export const getCutoffs = async (examCode) => {
    const { data } = await api.get(`/cutoffs/${encodeURIComponent(examCode)}`);
    return data.cutoff;
};
