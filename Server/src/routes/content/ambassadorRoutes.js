const express = require("express");
const router = express.Router();

const { rateLimit } = require("../../middlewares/rateLimiter");
const ambassador = require("../../controllers/content/ambassadorController");

// Public: anyone can apply to the Campus Ambassador Program. Rate-limited per IP
// to curb bots — a genuine applicant only ever applies once.
const applyLimit = rateLimit("ambassador", 12, 60 * 60);
router.post("/apply", applyLimit, ambassador.apply);

module.exports = router;
