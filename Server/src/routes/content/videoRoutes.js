const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const ctrl = require("../../controllers/content/videoController");

// Reads — any authenticated user. Students see published videos targeted at
// their universities; staff see everything.
router.get("/", verifyToken, ctrl.listVideos);

// Manage the video library — STAFF ONLY (mentors/admins). Students can only
// watch, never add/edit/remove.
router.post("/", verifyToken, requireStaff, ctrl.createVideo);
router.put("/:id", verifyToken, requireStaff, ctrl.updateVideo);
router.delete("/:id", verifyToken, requireStaff, ctrl.deleteVideo);

module.exports = router;
