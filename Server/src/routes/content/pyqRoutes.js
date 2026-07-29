const express = require("express");
const router = express.Router();
const multer = require("multer");

const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const pdfUploadStaff = require("../../middlewares/pdfUploadStaff");
const pyqController = require("../../controllers/content/pyqController");

// Wrap multer so its errors become clean 400s instead of crashing. Staff upload,
// so the larger 100 MB cap applies.
const handleUpload = (req, res, next) => {
    pdfUploadStaff(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Browse (any authenticated user)
router.get("/", verifyToken, pyqController.getPyqs);
router.get("/filters", verifyToken, pyqController.getFilters);
router.get("/:id", verifyToken, pyqController.getPyqById);

// Upload (mentors, admins, super admin)
router.post(
    "/",
    verifyToken,
    requireStaff,
    handleUpload,
    pyqController.uploadPyq
);

module.exports = router;
