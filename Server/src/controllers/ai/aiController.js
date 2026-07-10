const aiService = require("../../services/ai/aiService");

// GET /api/ai/status — which provider is live (drives the UI's mode indicator)
function getStatus(req, res) {
    return res.status(200).json({ success: true, provider: aiService.activeProvider() });
}

// GET /api/ai/health — can the active AI provider actually be reached? Cheap
// (no generation). Public so setup can be verified right after configuring a key.
async function health(req, res) {
    const ai = await aiService.health();
    return res.status(200).json({ success: true, ai });
}

// POST /api/ai/questions
async function generateQuestions(req, res, next) {
    try {
        const { subject, topic, difficulty = "moderate", count = 5 } = req.body || {};
        if (!subject && !topic) {
            return res.status(400).json({ success: false, message: "Provide a subject or topic" });
        }
        const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);
        const result = await aiService.generateQuestions({ subject, topic, difficulty, count: n });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

// POST /api/ai/predict-difficulty
async function predictDifficulty(req, res, next) {
    try {
        const { questionText } = req.body || {};
        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ success: false, message: "questionText is required" });
        }
        const result = await aiService.predictDifficulty({ questionText });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

// POST /api/ai/analyze — uses the caller's own stats
async function analyzePerformance(req, res, next) {
    try {
        const result = await aiService.analyzePerformance({
            stats: req.user.stats,
            targetExam: req.user.targetExam,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

// POST /api/ai/study-plan
async function generateStudyPlan(req, res, next) {
    try {
        const { days = 7, hoursPerDay = 2, weakAreas = [] } = req.body || {};
        const result = await aiService.generateStudyPlan({
            targetExam: req.user.targetExam || "LEET",
            days: Math.min(Math.max(parseInt(days, 10) || 7, 1), 30),
            hoursPerDay: Math.min(Math.max(parseInt(hoursPerDay, 10) || 2, 1), 12),
            weakAreas: Array.isArray(weakAreas) ? weakAreas : [],
        });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getStatus,
    health,
    generateQuestions,
    predictDifficulty,
    analyzePerformance,
    generateStudyPlan,
};
