const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const videoUploadMemory = require("../../middlewares/videoUploadMemory");
const ctrl = require("../../controllers/content/reviewController");

// Wrap multer so file-size / type errors become clean 400s.
const handleVideo = (req, res, next) => {
    videoUploadMemory(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            const message =
                err.code === "LIMIT_FILE_SIZE" ? "Video must be 50 MB or smaller." : err.message;
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

// PUBLIC — the landing page strip reads this with no auth (published only).
router.get("/", ctrl.listReviews);

// Manage — ADMIN ONLY (add a text review or upload a video review; remove one).
router.post("/", verifyToken, requireAdmin, handleVideo, ctrl.createReview);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteReview);

module.exports = router;
