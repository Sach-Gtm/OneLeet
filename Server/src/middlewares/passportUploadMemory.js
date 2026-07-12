const multer = require("multer");

// In-memory upload for the mandatory passport photo. Memory storage keeps this
// working on Render's ephemeral/read-only filesystem — no temp file is written,
// the buffer is streamed straight to Cloudinary. Hard 1 MB cap per the product
// spec (students must upload a photo "within 1MB").
const passportUploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files (JPG, PNG) are allowed"));
        }
        cb(null, true);
    },
});

module.exports = passportUploadMemory.single("photo");
