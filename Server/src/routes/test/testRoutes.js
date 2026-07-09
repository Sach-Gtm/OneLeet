const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const test = require("../../controllers/test/testController");

router.get("/", verifyToken, test.listTests);
router.get("/:id", verifyToken, test.getTest);
router.post("/:id/submit", verifyToken, test.submitTest);

module.exports = router;
