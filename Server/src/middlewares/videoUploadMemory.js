const multer = require("multer");

// In-memory upload for a short review video, streamed straight to Cloudinary
// (no disk write — works on Render's ephemeral filesystem). Field: "video".
// 50 MB cap keeps admin clips reasonable and memory use bounded.
const videoUploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("video/")) {
            return cb(new Error("Only video files (MP4, WebM, MOV) are allowed"));
        }
        cb(null, true);
    },
});

module.exports = videoUploadMemory.single("video");
