import api from "./axios";

const unwrap = (error) => {
    const e = new Error(error.response?.data?.message || "Something went wrong");
    e.status = error.response?.status;
    throw e;
};

export const getNotifications = async () => {
    try {
        const { data } = await api.get("/notifications");
        return data; // { notifications, unreadCount }
    } catch (error) {
        unwrap(error);
    }
};

export const markAllNotificationsRead = async () => {
    try {
        const { data } = await api.post("/notifications/read-all");
        return data;
    } catch (error) {
        unwrap(error);
    }
};

// Staff only.
export const sendNotification = async (payload) => {
    try {
        const { data } = await api.post("/notifications", payload);
        return data;
    } catch (error) {
        unwrap(error);
    }
};
