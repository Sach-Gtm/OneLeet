const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/content/examPatternController");

// STUDENT — the paper patterns for the exams they picked in their profile.
router.get("/me", verifyToken, ctrl.listMine);

// Manage — ADMIN ONLY (admins + superadmin). Full list + create/update/delete.
router.get("/", verifyToken, requireAdmin, ctrl.listAll);
router.post("/", verifyToken, requireAdmin, ctrl.createPattern);
router.patch("/:id", verifyToken, requireAdmin, ctrl.updatePattern);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deletePattern);

module.exports = router;
