const User = require("../../models/userModel");
const generateToken = require("../../utils/generateToken");
const { buildCookieOptions, SEVEN_DAYS } = require("../../utils/authCookie");

const sanitize = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    return obj;
};

// POST /api/auth/google-login
async function googleAuth(req, res, next) {
    try {
        let { name, email, googleId, avatar } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                message: "Email and Google ID are required",
            });
        }

        email = email.toLowerCase().trim();
        if (name) name = name.trim();

        let user = await User.findOne({ email });

        if (user) {
            // Link an existing local account to Google on first Google sign-in.
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                if (avatar && !user.avatar) user.avatar = avatar;
                await user.save();
            }

            const token = generateToken(user._id);
            res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));

            return res.status(200).json({
                success: true,
                message: "Google login successful",
                user: sanitize(user),
                token,
            });
        }

        // New Google user
        const newUser = await User.create({
            name,
            email,
            googleId,
            avatar,
            role: "student",
            authProvider: "google",
        });

        const token = generateToken(newUser._id);
        res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));

        return res.status(201).json({
            success: true,
            message: "Google registration successful",
            user: sanitize(newUser),
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

module.exports = googleAuth;
