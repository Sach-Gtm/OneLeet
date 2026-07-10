const crypto = require("crypto");
const fs = require("fs");
const User = require("../../models/userModel");
const cloudinary = require("../../config/cloudinary");
const generateToken = require("../../utils/generateToken");
const { buildCookieOptions, SEVEN_DAYS } = require("../../utils/authCookie");
const {
    sendMail,
    canSendEmail,
    verifyTransport,
} = require("../../utils/email");
const {
    generateOtp,
    hashOtp,
    OTP_TTL_MS,
    RESEND_COOLDOWN_MS,
} = require("../../utils/otp");

// Strip sensitive fields before returning a user in a response.
const sanitize = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.otpHash;
    delete obj.otpExpire;
    delete obj.otpLastSentAt;
    return obj;
};

const setAuthCookie = (res, userId) => {
    const token = generateToken(userId);
    res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));
    return token;
};

// Sets a fresh OTP hash + expiry on the user and returns the raw code. Does not
// save or send — the caller persists first, THEN emails, so a failed send never
// leaves an account that can't be verified.
function setOtp(user) {
    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpire = Date.now() + OTP_TTL_MS;
    user.otpLastSentAt = Date.now();
    return otp;
}

async function sendOtpEmail(user, otp) {
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#1e293b">Verify your OneLeet account</h2>
          <p style="color:#475569">Hi ${user.name || "there"}, use this code to verify your email:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;margin:16px 0">${otp}</p>
          <p style="color:#64748b;font-size:14px">This code expires in 10 minutes. If you didn't sign up for OneLeet, you can ignore this email.</p>
        </div>`;
    await sendMail({
        to: user.email,
        subject: "Your OneLeet verification code",
        html,
        text: `Your OneLeet verification code is ${otp}. It expires in 10 minutes.`,
    });
}

// POST /api/auth/register
async function register(req, res, next) {
    try {
        const { name, email, password, role, phone, avatar } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }

        // OTP only runs when email can ACTUALLY be delivered from this host
        // (checked at startup). A configured-but-unreachable transport falls
        // back to no-OTP so signup never gets stuck.
        const otpEnabled = canSendEmail();

        const user = await User.create({
            name,
            email,
            password,
            role: role === "teacher" ? "teacher" : "student",
            phone,
            avatar: avatar || undefined,
            authProvider: "local",
            isVerified: !otpEnabled,
        });

        if (otpEnabled) {
            const otp = setOtp(user);
            await user.save({ validateBeforeSave: false });
            // Send in the background — don't make the user wait on SMTP.
            sendOtpEmail(user, otp).catch((mailErr) =>
                console.error("[register] failed to send OTP:", mailErr.message)
            );
            return res.status(201).json({
                success: true,
                needsVerification: true,
                email: user.email,
                message:
                    "We've sent a 6-digit verification code to your email. Enter it to activate your account.",
            });
        }

        const token = setAuthCookie(res, user._id);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user: sanitize(user),
            token,
        });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists",
            });
        }
        next(error);
    }
}

// POST /api/auth/login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // password has select:false, so ask for it explicitly.
        const user = await User.findOne({ email }).select("+password");

        // Same generic message whether the user is missing, is a Google-only
        // account, or the password is wrong — don't leak which.
        if (!user || !user.password) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid email or password" });
        }

        // Only block accounts explicitly awaiting OTP (=== false). Legacy and
        // Google accounts have isVerified true and pass straight through.
        if (user.isVerified === false) {
            return res.status(403).json({
                success: false,
                needsVerification: true,
                email: user.email,
                message:
                    "Please verify your email to continue. Enter the code we emailed you, or request a new one.",
            });
        }

        const token = setAuthCookie(res, user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: sanitize(user),
            token,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/auth/me  (requires verifyToken)
async function getMe(req, res) {
    return res.status(200).json({ success: true, user: req.user });
}

// GET /api/auth/email-health — confirms whether OTP/reset emails can actually
// be delivered from this host (SMTP reachable + credentials valid). No secrets
// are returned. Useful right after configuring EMAIL_USER/EMAIL_PASS.
async function emailHealth(req, res) {
    const result = await verifyTransport();
    return res.status(200).json({ success: true, email: result });
}

// POST /api/auth/verify-otp — confirm the emailed code and log the user in.
async function verifyOtp(req, res, next) {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email }).select(
            "+otpHash +otpExpire"
        );

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid or expired code" });
        }

        // Already verified — treat as an idempotent success and log them in.
        if (user.isVerified && !user.otpHash) {
            const token = setAuthCookie(res, user._id);
            return res
                .status(200)
                .json({ success: true, user: sanitize(user), token });
        }

        if (!user.otpHash || !user.otpExpire || user.otpExpire.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Your code has expired. Please request a new one.",
            });
        }

        if (hashOtp(otp) !== user.otpHash) {
            return res
                .status(400)
                .json({ success: false, message: "Incorrect code. Please try again." });
        }

        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });

        const token = setAuthCookie(res, user._id);
        return res.status(200).json({
            success: true,
            message: "Email verified — welcome to OneLeet!",
            user: sanitize(user),
            token,
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/resend-otp — issue a fresh code, rate-limited per account.
async function resendOtp(req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }).select("+otpLastSentAt");

        // Don't reveal whether the account exists / is already verified.
        const generic = {
            success: true,
            message: "If your account needs verification, a new code has been sent.",
        };
        if (!user || user.isVerified) return res.status(200).json(generic);

        if (
            user.otpLastSentAt &&
            Date.now() - user.otpLastSentAt.getTime() < RESEND_COOLDOWN_MS
        ) {
            return res.status(429).json({
                success: false,
                message: "Please wait a minute before requesting another code.",
            });
        }

        const otp = setOtp(user);
        await user.save({ validateBeforeSave: false });
        sendOtpEmail(user, otp).catch((mailErr) =>
            console.error("[resend-otp] failed to send:", mailErr.message)
        );
        return res.status(200).json(generic);
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Respond the same way whether or not the account exists, to avoid
        // leaking which emails are registered.
        const genericMessage =
            "If an account exists for that email, a password reset link has been sent.";

        if (!user || user.authProvider === "google") {
            return res.status(200).json({ success: true, message: genericMessage });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save({ validateBeforeSave: false });

        const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
            .split(",")[0]
            .trim();
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        // Email the link when a provider is configured; otherwise log it so the
        // flow stays testable. Email failures must not 500 (and must not leak
        // whether the account exists), so swallow and log.
        try {
            await sendMail({
                to: email,
                subject: "Reset your OneLeet password",
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
                      <h2 style="color:#1e293b">Reset your password</h2>
                      <p style="color:#475569">We received a request to reset your OneLeet password. This link expires in 1 hour.</p>
                      <p style="margin:20px 0">
                        <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a>
                      </p>
                      <p style="color:#64748b;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
                    </div>`,
                text: `Reset your OneLeet password (expires in 1 hour): ${resetUrl}`,
            });
        } catch (mailErr) {
            console.error("[forgot-password] email send failed:", mailErr.message);
        }
        console.log(`[forgot-password] reset link for ${email}: ${resetUrl}`);

        const payload = { success: true, message: genericMessage };
        if (process.env.NODE_ENV !== "production") payload.resetUrl = resetUrl;
        return res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/reset-password/:token
async function resetPassword(req, res, next) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashed = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpire: { $gt: Date.now() },
        }).select("+resetPasswordToken +resetPasswordExpire");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Password reset link is invalid or has expired",
            });
        }

        user.password = password; // hashed by the pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset. Please log in with your new password.",
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/auth/me — update editable profile fields
async function updateProfile(req, res, next) {
    try {
        const allowed = ["name", "phone", "college", "branch", "yearOfStudy", "targetExam"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            returnDocument: "after",
            runValidators: true,
        }).select("-password");
        return res.status(200).json({ success: true, message: "Profile updated", user });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/change-password
async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select("+password");
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account signs in with Google. Use 'Forgot password' to set a password.",
            });
        }
        const match = await user.matchPassword(currentPassword);
        if (!match) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }
        user.password = newPassword; // hashed by the pre-save hook
        await user.save();
        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/me/avatar — upload a profile photo to Cloudinary
async function uploadAvatar(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image uploaded" });
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "oneleet/avatars",
            resource_type: "image",
            transformation: [{ width: 256, height: 256, crop: "fill", gravity: "auto" }],
        });
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: result.secure_url },
            { returnDocument: "after" }
        ).select("-password");
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(200).json({ success: true, message: "Avatar updated", avatar: result.secure_url, user });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        next(error);
    }
}

// POST /api/auth/logout
function logout(req, res) {
    res.cookie("token", "", { ...buildCookieOptions(), expires: new Date(0) });
    return res.status(200).json({ success: true, message: "Logout successful" });
}

module.exports = {
    register,
    login,
    getMe,
    emailHealth,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    uploadAvatar,
    logout,
};
