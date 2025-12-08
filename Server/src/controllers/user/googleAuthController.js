const User = require("../../models/userModel");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

async function googleAuth(req, res) {
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
            if (user.authProvider === "local" && !user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
                if (avatar) user.avatar = avatar;
                await user.save();
            }

            const token = generateToken(user._id);

            // Set cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.status(200).json({
                success: true,
                message: "Google login successful",
                user,
                token,
            });
        }

        // Create new
        const newUser = await User.create({
            name,
            email,
            googleId,
            avatar,
            authProvider: "google",
        });

        const token = generateToken(newUser._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "Google registration successful",
            user: newUser,
            token,
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

module.exports = googleAuth;
