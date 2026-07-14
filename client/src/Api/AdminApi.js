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

// Promote/demote a teammate by email. role: student|teacher|admin. Admins may
// only manage students; granting admin / touching staff is super-admin only
// (enforced by the API).
export const setUserRole = async (email, role) => {
    try {
        const { data } = await api.patch("/admin/users/role", { email, role });
        return data;
    } catch (error) {
        unwrap(error);
    }
};

// The mentor/admin roster ("who is admin and mentor").
export const getStaff = async () => {
    try {
        const { data } = await api.get("/admin/staff");
        return data.staff || [];
    } catch (error) {
        unwrap(error);
    }
};

// Remove an account. Admins may remove students only; the super admin may
// remove anyone (enforced by the API).
export const removeUser = async (id) => {
    try {
        const { data } = await api.delete(`/admin/users/${id}`);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
