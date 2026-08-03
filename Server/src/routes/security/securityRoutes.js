const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const security = require("../../controllers/security/securityController");

// Students report their own detected capture attempts on premium content. The
// rate limit is a safety net (the client also throttles); excess just 429s and
// is ignored client-side.
router.post("/report", verifyToken, rateLimit("security-report", 60, 60), security.report);

// Admins review who is attempting to capture premium content.
router.get("/alerts", verifyToken, requireAdmin, security.listAlerts);

module.exports = router;
