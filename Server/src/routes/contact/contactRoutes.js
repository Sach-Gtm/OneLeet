const express = require("express");
const router = express.Router();

const attachmentUploadMemory = require("../../middlewares/attachmentUploadMemory");
const contactController = require("../../controllers/contact/contactController");
const { rateLimit } = require("../../middlewares/rateLimiter");

// These endpoints send email + upload to Cloudinary, so cap them hard per IP —
// otherwise a bot could drain the email quota / spam the inbox.
router.use(rateLimit("contact", 6, 60 * 60));

// Wrap multer so its errors become clean 400s instead of crashing.
const handleAttachment = (req, res, next) => {
    attachmentUploadMemory(req, res, (err) => {
        if (err) {
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "Attachment must be 5 MB or smaller."
                    : err.message;
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

router.post("/bug", handleAttachment, contactController.bugReport);
router.post("/contribution", handleAttachment, contactController.contribution);
router.post("/callback", contactController.callback);

module.exports = router;
