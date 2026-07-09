import api from "./axios";

export const getLeaderboard = async () => {
    const { data } = await api.get("/leaderboard");
    return data;
};
