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

// Create/edit/delete — any signed-in user (students get a PERSONAL syllabus;
// staff get a GLOBAL one). Ownership is enforced inside the controller.
router.post("/", verifyToken, ctrl.createSyllabus);
router.get("/:id", verifyToken, ctrl.getSyllabus);
router.put("/:id", verifyToken, ctrl.updateSyllabus);
router.delete("/:id", verifyToken, ctrl.deleteSyllabus);

// Student progress.
router.post("/:id/toggle", verifyToken, ctrl.toggleTopic);

module.exports = router;
