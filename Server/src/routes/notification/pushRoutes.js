const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const c = require("../../controllers/notification/pushController");

// Public: the browser fetches the VAPID public key to subscribe with.
router.get("/vapid-public-key", c.vapidPublicKey);

// Everything else is per-user.
router.use(verifyToken);
router.post("/subscribe", c.subscribe);
router.post("/unsubscribe", c.unsubscribe);

module.exports = router;
