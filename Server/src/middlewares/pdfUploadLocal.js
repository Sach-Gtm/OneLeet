const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DEST = "src/uploads/pdf";
fs.mkdirSync(DEST, { recursive: true }); // ensure it exists on a fresh deploy

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DEST);
    },
    filename: (req, file, cb) => {
        // Strip directory components + unsafe chars from the client-supplied name.
        const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safe}`);
    },
});

const pdfUploadLocal = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB, the shared/default cap (also used by the non-staff note-PDF route)
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".pdf" || file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null, true);
    },
});

module.exports = pdfUploadLocal.single("pdfFile");