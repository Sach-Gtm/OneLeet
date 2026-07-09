const express = require("express");
const router = express.Router();

const authController = require("../../controllers/user/authController");
const { verifyToken } = require("../../middlewares/authMiddleware");
const { validate } = require("../../validations/validate");
const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("../../validations/user/authValidation");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getMe);
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
