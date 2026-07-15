const mongoose = require("mongoose");
const Attempt = require("../../models/attemptModel");
const User = require("../../models/userModel");
const Test = require("../../models/testModel");
const {
    isCompetitive,
    isDue,
    revealAt,
    rankBestAttempts,
    finalizeTestLeaderboard,
} = require("../../services/leaderboard/leaderboardService");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/leaderboard — weekly top performers, ranked by total score across
// mock-test attempts in the last 7 days (tie-break on average accuracy).
// Competitive tests whose leaderboard hasn't been published yet are EXCLUDED, so
// an in-progress graded test never leaks live standings into the global board.
async function getLeaderboard(req, res, next) {
    try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const lockedTestIds = await Test.find({
            mode: "test",
            closeAt: { $ne: null },
            leaderboardPublished: false,
        }).distinct("_id");

        const ranked = await Attempt.aggregate([
            { $match: { submittedAt: { $gte: weekAgo }, test: { $nin: lockedTestIds } } },
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

// GET /api/leaderboard/test/:id — the per-test leaderboard. For a competitive
// test it stays FROZEN (status "pending", countdown only) until ~5 min after the
// window closes, then finalises and returns the ranked board (status
// "published"). Non-competitive tests are always live.
async function getTestLeaderboard(req, res, next) {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ success: false, message: "Test not found" });
        }
        let test = await Test.findById(req.params.id);
        if (!test || !test.isPublished) {
            return res.status(404).json({ success: false, message: "Test not found" });
        }

        // Lazy finalisation — covers a missed scheduler tick (instance asleep), so
        // the board is always correct the moment someone opens it.
        if (isDue(test)) {
            await finalizeTestLeaderboard(test._id);
            test = await Test.findById(req.params.id);
        }

        const competitive = isCompetitive(test);
        const meId = String(req.user._id);

        // Frozen: reveal only the countdown and the caller's own score (which they
        // already saw on their result page) — never other people's standings.
        if (competitive && !test.leaderboardPublished) {
            const mine = await Attempt.find({ test: test._id, user: req.user._id })
                .sort({ score: -1 })
                .limit(1)
                .select("score totalMarks accuracy");
            return res.status(200).json({
                success: true,
                status: "pending",
                competitive: true,
                test: { _id: test._id, title: test.title, mode: test.mode },
                closeAt: test.closeAt,
                revealAt: revealAt(test),
                me: mine[0]
                    ? {
                          attempted: true,
                          score: mine[0].score,
                          totalMarks: mine[0].totalMarks,
                          accuracy: mine[0].accuracy,
                      }
                    : { attempted: false },
            });
        }

        // Published (or non-competitive → live): build the ranked board.
        const attempts = await Attempt.find({ test: test._id }).select(
            "user score totalMarks accuracy durationTakenSeconds submittedAt"
        );
        const ranked = rankBestAttempts(attempts);
        const total = ranked.length;
        const top = ranked.slice(0, 20);
        const users = await User.find({ _id: { $in: top.map((a) => a.user) } }).select(
            "name avatar"
        );
        const uMap = new Map(users.map((u) => [String(u._id), u]));
        const leaderboard = top.map((a, i) => {
            const u = uMap.get(String(a.user));
            return {
                rank: i + 1,
                userId: a.user,
                name: u?.name || "Student",
                avatar: u?.avatar || null,
                score: a.score,
                totalMarks: a.totalMarks,
                accuracy: a.accuracy,
                isCurrentUser: String(a.user) === meId,
            };
        });

        const meIdx = ranked.findIndex((a) => String(a.user) === meId);
        let me = { attempted: false };
        if (meIdx >= 0) {
            const a = ranked[meIdx];
            const rank = meIdx + 1;
            const meUser = await User.findById(req.user._id).select("achievements");
            const ach = meUser?.achievements || { rank1: 0, rank2: 0, rank3: 0 };
            me = {
                attempted: true,
                rank,
                score: a.score,
                totalMarks: a.totalMarks,
                accuracy: a.accuracy,
                total,
                isTop3: rank <= 3,
                // How many times they've reached this exact rank overall — powers
                // the "your Nth time!" celebration copy (competitive boards only).
                timesAtRank:
                    rank === 1 ? ach.rank1 : rank === 2 ? ach.rank2 : rank === 3 ? ach.rank3 : 0,
            };
        }

        return res.status(200).json({
            success: true,
            status: "published",
            competitive,
            publishedAt: test.leaderboardPublishedAt || null,
            test: { _id: test._id, title: test.title, mode: test.mode },
            total,
            leaderboard,
            me,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/leaderboard/hall-of-fame — the all-time Rank #1 recognition board.
async function getHallOfFame(req, res, next) {
    try {
        const champs = await User.find({ "achievements.rank1": { $gt: 0 } })
            .sort({ "achievements.rank1": -1, "achievements.rank2": -1, "achievements.rank3": -1 })
            .limit(50)
            .select("name avatar achievements");
        const meId = String(req.user._id);
        const hallOfFame = champs.map((u, i) => ({
            rank: i + 1,
            userId: u._id,
            name: u.name,
            avatar: u.avatar || null,
            timesRank1: u.achievements?.rank1 || 0,
            timesRank2: u.achievements?.rank2 || 0,
            timesRank3: u.achievements?.rank3 || 0,
            isCurrentUser: String(u._id) === meId,
        }));
        return res.status(200).json({ success: true, hallOfFame });
    } catch (error) {
        next(error);
    }
}

module.exports = { getLeaderboard, getTestLeaderboard, getHallOfFame };
