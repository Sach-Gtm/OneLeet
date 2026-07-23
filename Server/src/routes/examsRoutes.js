const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const { EXAMS } = require("../config/exams");

// GET /api/exams — the LEET exam catalog. Used by the staff "target universities"
// picker and by a student's "which exams am I preparing for" selector.
router.get("/", verifyToken, (req, res) => {
    res.status(200).json({ success: true, exams: EXAMS });
});

module.exports = router;
