const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const imageUploadMemory = require("../../middlewares/imageUploadMemory");
const ctrl = require("../../controllers/content/mentorController");

// Wrap multer so file-size / type errors become clean 400s.
const handlePhoto = (req, res, next) => {
    imageUploadMemory(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            const message =
                err.code === "LIMIT_FILE_SIZE" ? "Photo must be 3 MB or smaller." : err.message;
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

// PUBLIC — the Mentors page reads this without auth.
router.get("/", ctrl.listMentors);

// Manage — ADMIN ONLY (add with an optional photo, or remove).
router.post("/", verifyToken, requireAdmin, handlePhoto, ctrl.createMentor);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteMentor);

module.exports = router;
