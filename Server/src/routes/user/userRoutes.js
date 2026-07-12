const express = require("express");
const router = express.Router();
const multer = require("multer");

const authController = require("../../controllers/user/authController");
const { verifyToken } = require("../../middlewares/authMiddleware");
const { verifyTurnstile } = require("../../middlewares/turnstileMiddleware");
const { rateLimit } = require("../../middlewares/rateLimiter");
const imageUploadLocal = require("../../middlewares/imageUploadLocal");
const passportUploadMemory = require("../../middlewares/passportUploadMemory");
const { validate } = require("../../validations/validate");
const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    changePasswordSchema,
    verifyOtpSchema,
    resendOtpSchema,
} = require("../../validations/user/authValidation");

const handleAvatarUpload = (req, res, next) => {
    imageUploadLocal(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

const handlePassportUpload = (req, res, next) => {
    passportUploadMemory(req, res, (err) => {
        if (err) {
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "Photo must be 1 MB or smaller. Please compress it and try again."
                    : err.message;
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

// Brute-force / abuse protection: per-IP fixed windows on the auth surface.
router.post("/register", rateLimit("register", 20, 60 * 60), verifyTurnstile, validate(registerSchema), authController.register);
router.post("/login", rateLimit("login", 25, 15 * 60), verifyTurnstile, validate(loginSchema), authController.login);
router.post("/verify-otp", rateLimit("verify-otp", 20, 15 * 60), validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", rateLimit("resend-otp", 10, 15 * 60), validate(resendOtpSchema), authController.resendOtp);
router.get("/email-health", authController.emailHealth);
router.get("/media-health", authController.mediaHealth);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getMe);
router.patch("/me", verifyToken, validate(updateProfileSchema), authController.updateProfile);
router.post("/me/avatar", verifyToken, handleAvatarUpload, authController.uploadAvatar);
router.post(
    "/me/passport-photo",
    verifyToken,
    handlePassportUpload,
    authController.uploadPassportPhoto
);
router.post(
    "/change-password",
    verifyToken,
    validate(changePasswordSchema),
    authController.changePassword
);
router.post(
    "/forgot-password",
    rateLimit("forgot-password", 8, 15 * 60),
    validate(forgotPasswordSchema),
    authController.forgotPassword
);
router.post(
    "/reset-password/:token",
    rateLimit("reset-password", 15, 15 * 60),
    validate(resetPasswordSchema),
    authController.resetPassword
);

module.exports = router;
