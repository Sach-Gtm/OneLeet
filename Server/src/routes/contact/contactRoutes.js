const express = require("express");
const router = express.Router();

const attachmentUploadMemory = require("../../middlewares/attachmentUploadMemory");
const contactController = require("../../controllers/contact/contactController");
const { rateLimit } = require("../../middlewares/rateLimiter");
const { verifyToken } = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");

// The public submission endpoints send email + upload to Cloudinary, so cap them
// hard per IP — otherwise a bot could drain the email quota / spam the inbox.
const submitLimit = rateLimit("contact", 6, 60 * 60);

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

// Public: anyone can submit (rate-limited).
router.post("/bug", submitLimit, handleAttachment, contactController.bugReport);
router.post("/contribution", submitLimit, handleAttachment, contactController.contribution);
router.post("/callback", submitLimit, contactController.callback);

// Inbox: browse and manage everything that came in. Admins + Super Admin only
// — mentors must not see bug reports, callbacks or contributions.
router.use("/inbox", verifyToken, requireAdmin);
router.get("/inbox", contactController.listInbox);
router.patch("/inbox/:id/read", contactController.markInboxRead);
router.delete("/inbox/:id", contactController.deleteInbox);

module.exports = router;
