const Activity = require("../../models/activityModel");
const User = require("../../models/userModel");

const DAY = 24 * 60 * 60 * 1000;
const toMin = (s) => Math.round((s || 0) / 60);

// POST /api/activity/heartbeat — a few seconds of time on a page. Signed-in
// pings carry the user (via optionalAuth); anonymous landing-page pings carry
// only an anonId. Kept intentionally tiny and forgiving so it never disrupts
// the page it's measuring.
async function recordHeartbeat(req, res, next) {
    try {
        const seconds = Math.max(0, Math.min(600, Number(req.body.seconds) || 0));
        if (!seconds) return res.status(200).json({ success: true });

        const path = String(req.body.path || "").slice(0, 200);
        const userId = req.user?._id || null;
        const anonId = userId
            ? null
            : req.body.anonId
              ? String(req.body.anonId).slice(0, 60)
              : null;

        await Activity.create({ user: userId, anonId, path, seconds });

        // Reflect browsing (not just tests) in "active today" — throttled to at
        // most one write per 10 min per user so heartbeats stay cheap.
        if (userId) {
            const last = req.user.stats?.lastActiveAt;
            if (!last || Date.now() - new Date(last).getTime() > 10 * 60 * 1000) {
                await User.updateOne(
                    { _id: userId },
                    { $set: { "stats.lastActiveAt": new Date() } }
                );
            }
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
}

// Aggregates the time a user has spent, for the analytics page.
async function timeSummary(userId) {
    const since = new Date(Date.now() - 14 * DAY);
    const [totalAgg, byDay, topPages] = await Promise.all([
        Activity.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, seconds: { $sum: "$seconds" } } },
        ]),
        Activity.aggregate([
            { $match: { user: userId, createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    seconds: { $sum: "$seconds" },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Activity.aggregate([
            { $match: { user: userId } },
            { $group: { _id: "$path", seconds: { $sum: "$seconds" } } },
            { $sort: { seconds: -1 } },
            { $limit: 6 },
        ]),
    ]);
    return {
        totalMinutes: toMin(totalAgg[0]?.seconds),
        minutesByDay: byDay.map((d) => ({ date: d._id, minutes: toMin(d.seconds) })),
        topPages: topPages.map((p) => ({ path: p._id || "/", minutes: toMin(p.seconds) })),
    };
}

// GET /api/activity/me — the signed-in user's own time analytics.
async function myAnalytics(req, res, next) {
    try {
        const summary = await timeSummary(req.user._id);
        return res.status(200).json({ success: true, ...summary });
    } catch (error) {
        next(error);
    }
}

module.exports = { recordHeartbeat, myAnalytics, timeSummary };
