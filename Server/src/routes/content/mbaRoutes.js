const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const mba = require("../../controllers/content/mbaController");

// Auth: register for the OneLeet MBA batch (pick your college). Rate-limited per
// IP — a genuine student registers once.
const registerLimit = rateLimit("mba-register", 20, 60 * 60);
router.post("/register", registerLimit, verifyToken, mba.register);

// Auth: has this user already registered (and with which college)?
router.get("/status", verifyToken, mba.status);

// Admin: the full MBA batch registration list (leads).
router.get("/admin", verifyToken, requireAdmin, mba.adminList);

module.exports = router;
