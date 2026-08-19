const express = require("express");
const router = express.Router();

const { rateLimit } = require("../../middlewares/rateLimiter");
const scholarship = require("../../controllers/content/scholarshipController");

// Public: anyone can register for the scholarship test. Rate-limited per IP to
// curb bots — a genuine candidate only ever registers once.
const registerLimit = rateLimit("scholarship", 12, 60 * 60);
router.post("/register", registerLimit, scholarship.register);

module.exports = router;
