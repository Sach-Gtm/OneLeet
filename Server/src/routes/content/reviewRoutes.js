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

// PUBLIC — the Success Wall reads these with no auth (published only).
router.get("/", ctrl.listReviews);
router.get("/cases", ctrl.listCases);
router.get("/cases/:slug", ctrl.getCase);

// Manage — ADMIN ONLY. Full editor data, add/edit/remove.
router.get("/admin/all", verifyToken, requireAdmin, ctrl.adminListReviews);
router.post("/", verifyToken, requireAdmin, handleMedia, ctrl.createReview);
router.patch("/:id", verifyToken, requireAdmin, handleMedia, ctrl.updateReview);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteReview);

module.exports = router;
