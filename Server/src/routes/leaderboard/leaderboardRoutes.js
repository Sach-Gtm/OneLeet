const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const {
    getLeaderboard,
    getTestLeaderboard,
    getHallOfFame,
} = require("../../controllers/leaderboard/leaderboardController");

router.get("/", verifyToken, getLeaderboard);
router.get("/hall-of-fame", verifyToken, getHallOfFame);
router.get("/test/:id", verifyToken, getTestLeaderboard);

module.exports = router;
