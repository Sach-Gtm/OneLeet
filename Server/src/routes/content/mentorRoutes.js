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

// PUBLIC — the Mentors page reads the list without auth.
router.get("/", ctrl.listMentors);

// Manage — ADMIN ONLY. Full data for the editor (defined before /:slug so the
// literal "admin/all" path is never read as a slug).
router.get("/admin/all", verifyToken, requireAdmin, ctrl.adminListMentors);
router.post("/", verifyToken, requireAdmin, handlePhoto, ctrl.createMentor);
router.patch("/:id", verifyToken, requireAdmin, handlePhoto, ctrl.updateMentor);
router.delete("/:id", verifyToken, requireAdmin, ctrl.deleteMentor);

// PUBLIC — one mentor's full journey (kept last so it can't shadow the routes
// above). ObjectId ids used by PATCH/DELETE never collide with word slugs.
router.get("/:slug", ctrl.getMentor);

module.exports = router;
