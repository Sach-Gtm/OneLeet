const multer = require("multer");

// One in-memory upload for a landing-page review's media: EITHER a video clip
// (field "video") OR an image (field "image") — never both. Streamed straight to
// Cloudinary (no disk write, so it works on Render's ephemeral filesystem). The
// per-field mime type is checked here; the 50 MB ceiling covers video, and the
// controller enforces the tighter image cap.
const reviewMediaUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (video); image capped in the controller
    fileFilter: (req, file, cb) => {
        const okVideo = file.fieldname === "video" && file.mimetype.startsWith("video/");
        const okImage = file.fieldname === "image" && file.mimetype.startsWith("image/");
        if (!okVideo && !okImage) {
            return cb(new Error("Upload a video clip or an image file."));
        }
        cb(null, true);
    },
});

module.exports = reviewMediaUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
]);
