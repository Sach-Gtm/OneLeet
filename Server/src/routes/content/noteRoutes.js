const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireStaff } = require("../../middlewares/roleMiddleware");
const pdfUploadLocal = require("../../middlewares/pdfUploadLocal");
const noteController = require("../../controllers/content/noteController");
const multer = require("multer");

const handleMulterError = (req, res, next) => {
    pdfUploadLocal(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

//upload Pdf
router.post(
    "/upload",
    verifyToken,
    requireStaff,
    handleMulterError,
    noteController.uploadPdf
);

//getPdf - According to category
router.get("/:category", verifyToken, noteController.getPdf);


module.exports = router;