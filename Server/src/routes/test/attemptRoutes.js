const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const test = require("../../controllers/test/testController");

router.get("/", verifyToken, test.listAttempts);
router.get("/:id", verifyToken, test.getAttempt);

module.exports = router;
