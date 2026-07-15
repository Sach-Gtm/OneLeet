import api from "./axios";

export const getLeaderboard = async () => {
    const { data } = await api.get("/leaderboard");
    return data;
};

// Per-test board — returns { status: "pending" | "published", ... }. Pending
// while a graded test is live/cooling off; published once finalised.
export const getTestLeaderboard = async (testId) => {
    const { data } = await api.get(`/leaderboard/test/${testId}`);
    return data;
};

// All-time Rank #1 recognition board.
export const getHallOfFame = async () => {
    const { data } = await api.get("/leaderboard/hall-of-fame");
    return data;
};
