const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const ctrl = require("../../controllers/commerce/couponController");

// Student — preview a coupon at checkout (read-only). Rate-limited so a valid
// vs invalid response can't be scripted to brute-force discount codes.
router.post("/apply", rateLimit("coupon-apply", 20, 15 * 60), verifyToken, ctrl.applyCoupon);

// Admin — manage coupon codes.
router.get("/", verifyToken, requireAdmin, ctrl.listCoupons);
router.post("/", verifyToken, requireAdmin, ctrl.createCoupon);
router.patch("/:id", verifyToken, requireAdmin, ctrl.updateCoupon);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteCoupon);

module.exports = router;
