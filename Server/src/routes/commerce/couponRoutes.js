const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/commerce/couponController");

// Student — preview a coupon at checkout (read-only).
router.post("/apply", verifyToken, ctrl.applyCoupon);

// Admin — manage coupon codes.
router.get("/", verifyToken, requireAdmin, ctrl.listCoupons);
router.post("/", verifyToken, requireAdmin, ctrl.createCoupon);
router.patch("/:id", verifyToken, requireAdmin, ctrl.updateCoupon);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteCoupon);

module.exports = router;
