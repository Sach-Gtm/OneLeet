import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// PUBLIC — the Mentors page reads the list without auth.
export const getMentors = async () => {
    try {
        const { data } = await api.get("/mentors");
        return data.mentors || [];
    } catch (error) {
        unwrap(error);
    }
};

// PUBLIC — one mentor's full journey (detail page).
export const getMentor = async (slug) => {
    try {
        const { data } = await api.get(`/mentors/${slug}`);
        return data.mentor;
    } catch (error) {
        unwrap(error);
    }
};

// --- Admin management ---

// Full data for every mentor (incl. unpublished) so the editor can load all.
export const getMentorsAdmin = async () => {
    try {
        const { data } = await api.get("/mentors/admin/all");
        return data.mentors || [];
    } catch (error) {
        unwrap(error);
    }
};

// Build multipart form from a mentor payload. Arrays ride as JSON strings (the
// server parses them); a File `photo` is streamed to Cloudinary.
const toForm = (m) => {
    const form = new FormData();
    const scalars = ["name", "slug", "role", "exam", "tagline", "description", "story", "handle", "order"];
    scalars.forEach((k) => {
        if (m[k] !== undefined && m[k] !== null) form.append(k, m[k]);
    });
    if (m.published !== undefined) form.append("published", m.published ? "true" : "false");
    if (m.highlights !== undefined) form.append("highlights", JSON.stringify(m.highlights));
    if (m.stats !== undefined) form.append("stats", JSON.stringify(m.stats));
    if (m.links !== undefined) form.append("links", JSON.stringify(m.links));
    if (m.photo instanceof File) form.append("photo", m.photo);
    return form;
};

export const createMentor = async (mentor) => {
    try {
        const { data } = await api.post("/mentors", toForm(mentor));
        return data.mentor;
    } catch (error) {
        unwrap(error);
    }
};

export const updateMentor = async (id, mentor) => {
    try {
        const { data } = await api.patch(`/mentors/${id}`, toForm(mentor));
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
