const multer = require("multer");

// In-memory image upload (streamed straight to Cloudinary — no disk write, so it
// works on Render's ephemeral filesystem). Used for mentor photos. Field: "photo".
const imageUploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files (JPG, PNG, WEBP) are allowed"));
        }
        cb(null, true);
    },
});

module.exports = imageUploadMemory.single("photo");
