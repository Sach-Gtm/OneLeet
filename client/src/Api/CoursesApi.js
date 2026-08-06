import api from "./axios";

// Surface the server's message on failure so callers can toast something real
// ("Course not found") instead of "Request failed with status 404".
const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// --- Public catalog (annotates `enrolled` when signed in) ---

// The published course catalog. Returns [] on failure so the page can render an
// empty state instead of crashing.
export const getCourses = async () => {
    try {
        const { data } = await api.get("/courses");
        return data.courses || [];
    } catch (error) {
        unwrap(error);
    }
};

// One course by slug (the overview page).
export const getCourse = async (slug) => {
    try {
        const { data } = await api.get(`/courses/${slug}`);
        return data.course;
    } catch (error) {
        unwrap(error);
    }
};

// --- Enrollment (free; requires a signed-in student) ---

// The current student's active enrollments (with their courses).
export const getMyEnrollments = async () => {
    try {
        const { data } = await api.get("/enrollments/me");
        return data.courses || [];
    } catch (error) {
        unwrap(error);
    }
};

// Free-enroll in a batch — pass { slug } or { courseId }. Idempotent server-side.
// Returns { message, examCode, exams } (the recomputed user.exams cache).
export const enroll = async (payload) => {
    try {
        const { data } = await api.post("/enrollments", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};

// Leave a batch. Returns { message, exams }.
export const unenroll = async (courseId) => {
    try {
        const { data } = await api.delete(`/enrollments/${courseId}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
