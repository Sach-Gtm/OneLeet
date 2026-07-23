const multer = require("multer");
const fs = require("fs");

// Temp storage for a file the AI will READ (a page photo, a diagram, a PDF) and
// turn into notes. Accepts images + PDF — the mimetypes Gemini can ingest as
// inline data. Field name: "attachment".
const DEST = "src/uploads/media";
fs.mkdirSync(DEST, { recursive: true });

const ALLOWED = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
    "image/heif",
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DEST),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const mediaUploadLocal = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (!ALLOWED.has(file.mimetype)) {
            return cb(new Error("Attach a PDF or an image (PNG, JPG or WEBP)."));
        }
        cb(null, true);
    },
});

module.exports = mediaUploadLocal.single("attachment");
