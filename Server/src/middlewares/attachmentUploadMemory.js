const multer = require("multer");

// In-memory upload for contact-form attachments (bug screenshots, contributed
// papers). Memory storage streams straight to Cloudinary — nothing touches the
// ephemeral disk. Accepts images and PDFs up to 5 MB.
const attachmentUploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
            return cb(null, true);
        }
        cb(new Error("Only images or PDF files are allowed"));
    },
});

module.exports = attachmentUploadMemory.single("file");
