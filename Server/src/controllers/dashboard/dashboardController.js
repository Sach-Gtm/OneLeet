const Attempt = require("../../models/attemptModel");

// Aggregated data for the student dashboard: the user's denormalised stats plus
// their most recent activity (completed mock tests). `continueLearning` stays
// empty until learning-progress tracking lands.
async function getDashboard(req, res, next) {
    try {
        const s = req.user.stats || {};

        const attempts = await Attempt.find({ user: req.user._id })
            .select("testTitle score totalMarks accuracy submittedAt")
            .sort({ submittedAt: -1 })
            .limit(5);

        const recentActivity = attempts.map((a) => ({
            type: "test",
            title: `Completed ${a.testTitle || "a mock test"}`,
            meta: `Score ${a.score}/${a.totalMarks} · ${a.accuracy}%`,
            time: a.submittedAt,
        }));

        return res.status(200).json({
            success: true,
            stats: {
                testsTaken: s.testsTaken || 0,
                accuracy: s.accuracy || 0,
                pyqsSolved: s.pyqsSolved || 0,
                studyHours: s.studyHours || 0,
                streak: s.streak || 0,
                overallPrep: s.overallPrep || 0,
            },
            recentActivity,
            continueLearning: [],
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getDashboard };
