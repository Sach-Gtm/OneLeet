const express = require("express");
const router = express.Router();

const { verifyToken, optionalAuth } = require("../../middlewares/authMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const c = require("../../controllers/activity/activityController");

// Heartbeat is open to everyone — anonymous landing-page visits count too. The
// per-IP cap is generous so shared campus IPs aren't throttled; the client
// ignores failures so a blocked ping never affects the page.
router.post(
    "/heartbeat",
    rateLimit("heartbeat", 600, 60 * 60),
    optionalAuth,
    c.recordHeartbeat
);

// A student's own time analytics.
router.get("/me", verifyToken, c.myAnalytics);

module.exports = router;
