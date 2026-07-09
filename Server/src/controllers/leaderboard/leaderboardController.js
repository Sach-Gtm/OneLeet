const Attempt = require("../../models/attemptModel");
const User = require("../../models/userModel");

// GET /api/leaderboard — weekly top performers, ranked by total score across
// mock-test attempts in the last 7 days (tie-break on average accuracy).
async function getLeaderboard(req, res, next) {
    try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const ranked = await Attempt.aggregate([
            { $match: { submittedAt: { $gte: weekAgo } } },
            {
                $group: {
                    _id: "$user",
                    totalScore: { $sum: "$score" },
                    totalMarks: { $sum: "$totalMarks" },
                    tests: { $sum: 1 },
                    avgAccuracy: { $avg: "$accuracy" },
                },
            },
            { $sort: { totalScore: -1, avgAccuracy: -1 } },
        ]);

        const withRank = ranked.map((r, i) => ({ ...r, rank: i + 1 }));
        const top = withRank.slice(0, 10);

        const users = await User.find({ _id: { $in: top.map((t) => t._id) } }).select("name avatar");
        const userMap = new Map(users.map((u) => [String(u._id), u]));

        const leaderboard = top.map((t) => {
            const u = userMap.get(String(t._id));
            return {
                rank: t.rank,
                userId: t._id,
                name: u?.name || "Student",
                avatar: u?.avatar || null,
                totalScore: t.totalScore,
                totalMarks: t.totalMarks,
                tests: t.tests,
                accuracy: Math.round(t.avgAccuracy || 0),
                isCurrentUser: String(t._id) === String(req.user._id),
            };
        });

        const meEntry = withRank.find((r) => String(r._id) === String(req.user._id));
        const me = meEntry
            ? {
                  rank: meEntry.rank,
                  totalScore: meEntry.totalScore,
                  totalMarks: meEntry.totalMarks,
                  tests: meEntry.tests,
                  accuracy: Math.round(meEntry.avgAccuracy || 0),
                  inTop: meEntry.rank <= 10,
              }
            : null;

        return res.status(200).json({ success: true, period: "week", leaderboard, me });
    } catch (error) {
        next(error);
    }
}

module.exports = { getLeaderboard };
