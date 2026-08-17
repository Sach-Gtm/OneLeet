const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Larger 100 MB PDF upload — for STAFF only (mentors/admins uploading notes and
// PYQ papers). Students never reach these routes; their PDF path keeps the
// smaller 10 MB cap in pdfUploadLocal. (The storage provider's own plan cap on
// file size still applies downstream.)
const DEST = "src/uploads/pdf";
fs.mkdirSync(DEST, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DEST),
    filename: (req, file, cb) => {
        const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safe}`);
    },
});

const pdfUploadStaff = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".pdf" || file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null, true);
    },
});

module.exports = pdfUploadStaff.single("pdfFile");
