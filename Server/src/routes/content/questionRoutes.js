const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireRole } = require("../../middlewares/roleMiddleware");
const questionController = require("../../controllers/content/questionController");

// The whole question bank is staff-only (teachers + admins).
router.use(verifyToken, requireRole("teacher", "admin"));

router.post("/", questionController.createQuestion);
router.get("/", questionController.listQuestions);
router.delete("/:id", questionController.deleteQuestion);

module.exports = router;
