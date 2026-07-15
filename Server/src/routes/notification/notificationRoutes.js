const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const c = require("../../controllers/notification/notificationController");

router.use(verifyToken);

// Anyone logged in can read their own notifications.
router.get("/", c.listForMe);
router.post("/read-all", c.markAllRead);

// Mentors, admins and the Super Admin can broadcast.
router.post("/", requireStaff, c.create);

module.exports = router;
