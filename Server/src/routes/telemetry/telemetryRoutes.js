const express = require("express");
const router = express.Router();

const { optionalAuth } = require("../../middlewares/authMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const c = require("../../controllers/telemetry/telemetryController");

// Crash reports come from everyone (a crash can happen before login, on the
// landing page), so this is open + optionalAuth. Rate-limited per IP so a render
// loop or abuse can't flood the collection; the client also dedupes + caps.
router.post("/client-error", rateLimit("client-error", 60, 60 * 60), optionalAuth, c.reportClientError);

// Funnel analytics events — a handful fire per session, so the cap is generous.
router.post("/event", rateLimit("event", 300, 60 * 60), optionalAuth, c.recordEvent);

module.exports = router;
