const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin, requireSuperadmin } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/commerce/paymentController");

// ── Student ──
router.post("/orders", verifyToken, ctrl.createOrder);
router.get("/orders/me", verifyToken, ctrl.myOrders);
router.get("/orders/:id", verifyToken, ctrl.getOrder);
router.post("/orders/:id/pay", verifyToken, ctrl.payInstallment); // next split installment
router.post("/verify", verifyToken, ctrl.verifyPayment); // LIVE Razorpay signature callback

// ── Admin (manual confirm + reopen + list) ──
router.get("/admin/orders", verifyToken, requireAdmin, ctrl.adminListOrders);
router.post("/admin/orders/:id/confirm", verifyToken, requireAdmin, ctrl.adminConfirm);
router.post("/admin/orders/:id/reopen", verifyToken, requireAdmin, ctrl.adminReopen);

// ── Superadmin (premium lock/unlock/grant) ──
router.patch("/admin/premium/:userId", verifyToken, requireSuperadmin, ctrl.adminSetPremium);

module.exports = router;
