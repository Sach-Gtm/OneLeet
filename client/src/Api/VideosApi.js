import api from "./axios";

// Surface the server's message on failure so staff see a real toast
// ("Paste a valid YouTube link.") instead of "Request failed with status 400".
const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

// Students see published videos (filtered to their universities); staff see all.
export const getVideos = async () => {
    try {
        const { data } = await api.get("/videos");
        return data.videos || [];
    } catch (error) {
        unwrap(error);
    }
};

// --- Staff management (mentor/admin) ---
export const createVideo = async (payload) => {
    try {
        const { data } = await api.post("/videos", payload);
        return data.video;
    } catch (error) {
        unwrap(error);
    }
};

export const updateVideo = async (id, payload) => {
    try {
        const { data } = await api.put(`/videos/${id}`, payload);
        return data.video;
    } catch (error) {
        unwrap(error);
    }
};

export const deleteVideo = async (id) => {
    try {
        const { data } = await api.delete(`/videos/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
