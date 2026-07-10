const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const ai = require("../../controllers/ai/aiController");

router.get("/health", ai.health);
router.get("/status", verifyToken, ai.getStatus);
router.post("/questions", verifyToken, ai.generateQuestions);
router.post("/predict-difficulty", verifyToken, ai.predictDifficulty);
router.post("/analyze", verifyToken, ai.analyzePerformance);
router.post("/study-plan", verifyToken, ai.generateStudyPlan);

module.exports = router;
