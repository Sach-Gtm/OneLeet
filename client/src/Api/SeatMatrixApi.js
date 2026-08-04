import api from "./axios";

// Which exams currently have a published seat matrix (to gate the button).
export const getSeatMatrixIndex = async () => {
    try {
        const { data } = await api.get("/seat-matrix");
        return data.matrices || [];
    } catch {
        return [];
    }
};

// The full college→branch seat matrix for one exam.
export const getSeatMatrix = async (examCode) => {
    const { data } = await api.get(`/seat-matrix/${encodeURIComponent(examCode)}`);
    return data.matrix;
};
