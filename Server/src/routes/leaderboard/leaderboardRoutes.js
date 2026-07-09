const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const { getLeaderboard } = require("../../controllers/leaderboard/leaderboardController");

router.get("/", verifyToken, getLeaderboard);

module.exports = router;
