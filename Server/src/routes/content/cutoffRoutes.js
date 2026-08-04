const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const ctrl = require("../../controllers/content/cutoffController");

// Cut-offs are shown to signed-in students on the exam-pattern page.
router.get("/", verifyToken, ctrl.listAvailable);
router.get("/:examCode", verifyToken, ctrl.getByExamCode);

module.exports = router;
