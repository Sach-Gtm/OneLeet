import api from "./axios";

export const listPosts = async (params) => {
    const { data } = await api.get("/community/posts", { params });
    return data;
};

export const createPost = async (payload) => {
    const { data } = await api.post("/community/posts", payload);
    return data;
};

export const getPost = async (id) => {
    const { data } = await api.get(`/community/posts/${id}`);
    return data;
};

export const addReply = async (id, body) => {
    const { data } = await api.post(`/community/posts/${id}/replies`, { body });
    return data;
};

export const toggleUpvote = async (id) => {
    const { data } = await api.post(`/community/posts/${id}/upvote`);
    return data;
};
