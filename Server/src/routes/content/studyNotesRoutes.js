const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const pdfUploadLocal = require("../../middlewares/pdfUploadLocal");
const mediaUploadLocal = require("../../middlewares/mediaUploadLocal");
const notes = require("../../controllers/content/studyNotesController");

const handleUpload = (req, res, next) => {
    pdfUploadLocal(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// For AI drafting: an OPTIONAL image/PDF the AI reads. No file (a plain JSON
// prompt) is fine — multer just passes through.
const handleMedia = (req, res, next) => {
    mediaUploadLocal(req, res, (err) => {
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

// AI-draft a note from a freeform instruction + optional image/PDF (staff only).
router.post("/generate", verifyToken, requireStaff, handleMedia, notes.generateNoteDraft);

// Upload / publish a note (mentors, admins, super admin).
router.post("/", verifyToken, requireStaff, handleUpload, notes.uploadNote);

module.exports = router;
