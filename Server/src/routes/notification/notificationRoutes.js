const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireRole } = require("../../middlewares/roleMiddleware");
const c = require("../../controllers/notification/notificationController");

router.use(verifyToken);

// Anyone logged in can read their own notifications.
router.get("/", c.listForMe);
router.post("/read-all", c.markAllRead);

// Only staff can broadcast.
router.post("/", requireRole("admin", "teacher"), c.create);

module.exports = router;
