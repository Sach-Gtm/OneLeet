const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const ai = require("../../controllers/ai/aiController");

// Generation endpoints call the paid/quota'd AI provider — cap them per IP so
// one user can't burn the whole Gemini quota.
const aiLimit = rateLimit("ai-generate", 30, 15 * 60);

router.get("/health", ai.health);
router.get("/status", verifyToken, ai.getStatus);
router.get("/trending", verifyToken, ai.trending);
router.post("/questions", verifyToken, aiLimit, ai.generateQuestions);
router.post("/predict-difficulty", verifyToken, aiLimit, ai.predictDifficulty);
router.post("/analyze", verifyToken, aiLimit, ai.analyzePerformance);
router.post("/study-plan", verifyToken, aiLimit, ai.generateStudyPlan);

module.exports = router;
