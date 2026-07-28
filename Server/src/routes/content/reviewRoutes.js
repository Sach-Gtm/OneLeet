const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/content/reviewController");

// PUBLIC — the landing page strip reads this with no auth (published only).
router.get("/", ctrl.listReviews);

// Manage — ADMIN ONLY (add / remove landing-page reviews).
router.post("/", verifyToken, requireAdmin, ctrl.createReview);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteReview);

module.exports = router;
