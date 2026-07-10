const express = require("express");
const router = express.Router();
const multer = require("multer");

const authController = require("../../controllers/user/authController");
const { verifyToken } = require("../../middlewares/authMiddleware");
const { verifyTurnstile } = require("../../middlewares/turnstileMiddleware");
const imageUploadLocal = require("../../middlewares/imageUploadLocal");
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

router.post("/register", verifyTurnstile, validate(registerSchema), authController.register);
router.post("/login", verifyTurnstile, validate(loginSchema), authController.login);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
router.get("/email-health", authController.emailHealth);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getMe);
router.patch("/me", verifyToken, validate(updateProfileSchema), authController.updateProfile);
router.post("/me/avatar", verifyToken, handleAvatarUpload, authController.uploadAvatar);
router.post(
    "/change-password",
    verifyToken,
    validate(changePasswordSchema),
    authController.changePassword
);
router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    authController.forgotPassword
);
router.post(
    "/reset-password/:token",
    validate(resetPasswordSchema),
    authController.resetPassword
);

module.exports = router;
