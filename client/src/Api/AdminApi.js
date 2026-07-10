import api from "./axios";

const unwrap = (error) => {
    const data = error.response?.data;
    const e = new Error(data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

export const getAdminOverview = async () => {
    try {
        const { data } = await api.get("/admin/overview");
        return data.overview;
    } catch (error) {
        unwrap(error);
    }
};

export const getStudents = async ({ search = "", page = 1, limit = 20 } = {}) => {
    try {
        const { data } = await api.get("/admin/students", {
            params: { search, page, limit },
        });
        return data;
    } catch (error) {
        unwrap(error);
    }
};

export const setStudentPlan = async (id, plan) => {
    try {
        const { data } = await api.patch(`/admin/students/${id}/plan`, { plan });
        return data;
    } catch (error) {
        unwrap(error);
    }
};

// Promote/demote a teammate by email (admin only). role: student|teacher|admin
export const setUserRole = async (email, role) => {
    try {
        const { data } = await api.patch("/admin/users/role", { email, role });
        return data;
    } catch (error) {
        unwrap(error);
    }
};
