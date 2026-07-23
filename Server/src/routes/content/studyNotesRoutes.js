const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const pdfUploadLocal = require("../../middlewares/pdfUploadLocal");
const notes = require("../../controllers/content/studyNotesController");

const handleUpload = (req, res, next) => {
    pdfUploadLocal(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Browse (any authenticated user)
router.get("/", verifyToken, notes.getNotes);
router.get("/filters", verifyToken, notes.getNotesFilters);
router.get("/:id", verifyToken, notes.getNoteById);

// AI actions
router.post("/:id/summary", verifyToken, notes.summarizeNote);
router.post("/:id/flashcards", verifyToken, notes.generateFlashcards);

// AI-draft a note's content from a topic (mentors, admins, super admin).
router.post("/generate", verifyToken, requireStaff, notes.generateNoteDraft);

// Upload / publish a note (mentors, admins, super admin).
router.post("/", verifyToken, requireStaff, handleUpload, notes.uploadNote);

module.exports = router;
