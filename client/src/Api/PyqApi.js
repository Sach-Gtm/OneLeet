import api from "./axios";

// `params` uses comma-separated strings for multi-value filters, e.g.
// { year: "2023,2022", difficulty: "hard", q: "logic", sort: "newest", page: 1 }
export const getPyqs = async (params) => {
    const { data } = await api.get("/pyqs", { params });
    return data;
};

export const getPyqFilters = async () => {
    const { data } = await api.get("/pyqs/filters");
    return data;
};
