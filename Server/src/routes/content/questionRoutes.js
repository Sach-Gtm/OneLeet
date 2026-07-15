const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const questionController = require("../../controllers/content/questionController");

// The whole question bank is staff-only (mentors, admins, super admin).
router.use(verifyToken, requireStaff);

router.post("/", questionController.createQuestion);
router.get("/", questionController.listQuestions);
router.delete("/:id", questionController.deleteQuestion);

module.exports = router;
