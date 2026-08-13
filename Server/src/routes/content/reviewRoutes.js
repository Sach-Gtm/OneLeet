const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const reviewMediaUpload = require("../../middlewares/reviewMediaUpload");
const ctrl = require("../../controllers/content/reviewController");

// Wrap multer so file-size / type errors become clean 400s. Accepts either a
// "video" or an "image" field (image size is re-checked in the controller).
const handleMedia = (req, res, next) => {
    reviewMediaUpload(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            const message =
                err.code === "LIMIT_FILE_SIZE" ? "That file is too large." : err.message;
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

// PUBLIC — the landing page strip reads this with no auth (published only).
router.get("/", ctrl.listReviews);

// Manage — ADMIN ONLY (add a text / image / video review; remove one).
router.post("/", verifyToken, requireAdmin, handleMedia, ctrl.createReview);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteReview);

module.exports = router;
