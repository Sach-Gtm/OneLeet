const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/commerce/referralController");

// Student — my referral code + progress.
router.get("/me", verifyToken, ctrl.myReferral);

// Admin — see who's earned the reward, mark it fulfilled.
router.get("/admin", verifyToken, requireAdmin, ctrl.adminListReferrals);
router.post("/admin/:id/fulfilled", verifyToken, requireAdmin, ctrl.adminMarkFulfilled);

module.exports = router;
