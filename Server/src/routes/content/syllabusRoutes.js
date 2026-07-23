const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const pdfUploadLocal = require("../../middlewares/pdfUploadLocal");
const ctrl = require("../../controllers/content/syllabusController");

const handleUpload = (req, res, next) => {
    pdfUploadLocal(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Reads — any authenticated user (students see published syllabi only).
router.get("/", verifyToken, ctrl.listSyllabi);
router.get("/me/summary", verifyToken, ctrl.myProgressSummary);

// AI authoring — STAFF ONLY (mentors/admins). Declared before "/:id" so the
// literal paths win.
router.post("/ai-draft", verifyToken, requireStaff, ctrl.aiDraftSyllabus);
router.post("/ai-scan", verifyToken, requireStaff, handleUpload, ctrl.aiScanSyllabus);

// Create/edit/delete — STAFF ONLY (managed from the Content Studio).
router.post("/", verifyToken, requireStaff, ctrl.createSyllabus);
router.get("/:id", verifyToken, ctrl.getSyllabus);
router.put("/:id", verifyToken, requireStaff, ctrl.updateSyllabus);
router.delete("/:id", verifyToken, requireStaff, ctrl.deleteSyllabus);

// Student progress (any signed-in user tracks their own completion).
router.post("/:id/toggle", verifyToken, ctrl.toggleTopic);

module.exports = router;
