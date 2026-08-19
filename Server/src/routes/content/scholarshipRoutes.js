const express = require("express");
const router = express.Router();

const { rateLimit } = require("../../middlewares/rateLimiter");
const scholarship = require("../../controllers/content/scholarshipController");

// Public: anyone can register for the scholarship test. Rate-limited per IP to
// curb bots — a genuine candidate only ever registers once.
const registerLimit = rateLimit("scholarship", 12, 60 * 60);
router.post("/register", registerLimit, scholarship.register);

// Public live tally for the landing's social proof. Cheap count query, but
// rate-limited generously — clients poll every ~30s and many students can share
// one college/office NAT IP, so this needs plenty of headroom.
const countLimit = rateLimit("scholarship-count", 600, 60 * 60);
router.get("/count", countLimit, scholarship.count);

module.exports = router;
