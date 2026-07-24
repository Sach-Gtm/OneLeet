const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { getExams } = require("../config/exams");

// GET /api/exams — the live LEET exam catalog. Used by the staff "target
// universities" picker and a student's "which exams am I preparing for" selector.
router.get("/", verifyToken, (req, res) => {
    res.status(200).json({ success: true, exams: getExams() });
});

module.exports = router;
