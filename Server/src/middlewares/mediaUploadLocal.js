const multer = require("multer");
const path = require("path");
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
    filename: (req, file, cb) => {
        const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safe}`);
    },
});

const mediaUploadLocal = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (the AI can only read the first ~15-20 MB inline)
    fileFilter: (req, file, cb) => {
        if (!ALLOWED.has(file.mimetype)) {
            return cb(new Error("Attach a PDF or an image (PNG, JPG or WEBP)."));
        }
        cb(null, true);
    },
});

module.exports = mediaUploadLocal.single("attachment");
