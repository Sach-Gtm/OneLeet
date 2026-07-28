import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// PUBLIC — the Mentors page reads this without auth.
export const getMentors = async () => {
    try {
        const { data } = await api.get("/mentors");
        return data.mentors || [];
    } catch (error) {
        unwrap(error);
    }
};

// --- Admin management ---
// Multipart because a photo may be attached; the rest ride along as fields.
export const createMentor = async ({ name, exam, description, handle, photo }) => {
    try {
        const form = new FormData();
        form.append("name", name);
        if (exam) form.append("exam", exam);
        if (description) form.append("description", description);
        if (handle) form.append("handle", handle);
        if (photo) form.append("photo", photo);
        const { data } = await api.post("/mentors", form);
        return data.mentor;
    } catch (error) {
        unwrap(error);
    }
};

export const deleteMentor = async (id) => {
    try {
        const { data } = await api.delete(`/mentors/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
