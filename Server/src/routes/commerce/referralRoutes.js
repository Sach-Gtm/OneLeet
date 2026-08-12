const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const ctrl = require("../../controllers/commerce/referralController");

// Student — my referral code + progress.
router.get("/me", verifyToken, ctrl.myReferral);
// Student — validate a friend's referral code at checkout. Rate-limited to stop
// enumeration of which codes exist.
router.post("/validate", rateLimit("referral-validate", 30, 15 * 60), verifyToken, ctrl.validateReferral);

// Admin — see who's earned the reward, mark it fulfilled.
router.get("/admin", verifyToken, requireAdmin, ctrl.adminListReferrals);
router.post("/admin/:id/fulfilled", verifyToken, requireAdmin, ctrl.adminMarkFulfilled);

module.exports = router;
