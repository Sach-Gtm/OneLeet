const User = require("../../models/userModel");
const generateToken = require("../../utils/generateToken");
const { buildCookieOptions, SEVEN_DAYS } = require("../../utils/authCookie");
const { SUPERADMIN_EMAIL } = require("../../config/roles");
const { isEmailBlocked } = require("../../utils/blocklist");

const sanitize = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    return obj;
};

// Exchange the client's Google access token for the VERIFIED identity. Only
// Google can mint a token that resolves here, so the returned email/sub are
// trustworthy — unlike anything the client puts in the request body.
async function fetchGoogleIdentity(accessToken) {
    const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const info = await resp.json();
    if (!info || !info.sub || !info.email) return null;
    // Google marks whether it has verified ownership of the address.
    if (info.email_verified === false) return null;
    return {
        googleId: info.sub,
        email: String(info.email).toLowerCase().trim(),
        name: (info.name || info.given_name || "").trim(),
        avatar: info.picture || undefined,
    };
}

// POST /api/auth/google-login
async function googleAuth(req, res, next) {
    try {
        const identity = await fetchGoogleIdentity(req.body.accessToken);
        if (!identity) {
            return res.status(401).json({
                success: false,
                message: "Could not verify your Google sign-in. Please try again.",
            });
        }
        const { googleId, email, name, avatar } = identity;

        // Blocked (e.g. removed) emails can't sign up or sign in via Google either.
        if (await isEmailBlocked(email)) {
            return res.status(403).json({
                success: false,
                message: "This account has been blocked. If you think this is a mistake, contact help@oneleet.in.",
            });
        }

        // The Super Admin is provisioned by a Google-VERIFIED matching email
        // (safe: the address ownership is proven by Google above).
        const superadminEmail = email === SUPERADMIN_EMAIL;

        let user = await User.findOne({ email });

        if (user) {
            // Bind the Google identity on first Google sign-in. We do NOT change
            // the role of a pre-existing account here — superadmin is only ever
            // assigned at fresh creation (below), so no already-issued session
            // for a squatted account can be escalated.
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = "google";
            }
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save({ validateBeforeSave: false });

            const token = generateToken(user._id);
            res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));
            return res.status(200).json({
                success: true,
                message: "Google login successful",
                user: sanitize(user),
                token,
            });
        }

        // New Google user.
        const newUser = await User.create({
            name,
            email,
            googleId,
            avatar,
            role: superadminEmail ? "superadmin" : "student",
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
