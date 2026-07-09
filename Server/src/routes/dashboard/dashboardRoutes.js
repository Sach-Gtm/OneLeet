const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const { getDashboard } = require("../../controllers/dashboard/dashboardController");

router.get("/", verifyToken, getDashboard);

module.exports = router;
