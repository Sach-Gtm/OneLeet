// Aggregated data for the student dashboard. Today it surfaces the user's
// denormalised stats; `recentActivity` and `continueLearning` are returned as
// empty arrays and will be populated by the Tests / PYQ / Notes features as
// those land (this keeps the frontend contract stable so the dashboard doesn't
// need a rewrite later).
async function getDashboard(req, res, next) {
    try {
        const s = req.user.stats || {};

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
            recentActivity: [],
            continueLearning: [],
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getDashboard };
