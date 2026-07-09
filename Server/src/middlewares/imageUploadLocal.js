const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DEST = "src/uploads/images";
fs.mkdirSync(DEST, { recursive: true }); // ensure it exists on a fresh deploy

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DEST);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];

const imageUploadLocal = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED.includes(ext) || !file.mimetype.startsWith("image/")) {
            return cb(new Error("Only JPG, PNG or WEBP images are allowed"));
        }
        cb(null, true);
    },
});

module.exports = imageUploadLocal.single("avatar");
