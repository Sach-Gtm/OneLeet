const crypto = require("crypto");
const fs = require("fs");
const User = require("../../models/userModel");
const cloudinary = require("../../config/cloudinary");
const generateToken = require("../../utils/generateToken");
const { buildCookieOptions, SEVEN_DAYS } = require("../../utils/authCookie");

// Strip sensitive fields before returning a user in a response.
const sanitize = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    return obj;
};

const setAuthCookie = (res, userId) => {
    const token = generateToken(userId);
    res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));
    return token;
};

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

        const user = await User.create({
            name,
            email,
            password,
            role: role || "student",
            phone: phone || undefined,
            avatar: avatar || undefined,
            authProvider: "local",
        });

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

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        // TODO: send `resetUrl` by email once an email provider is configured.
        // Until then we log it, and in non-production also return it so the
        // flow is testable end-to-end.
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
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    uploadAvatar,
    logout,
};
