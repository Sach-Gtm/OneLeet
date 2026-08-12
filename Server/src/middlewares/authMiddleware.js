const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Reads the JWT from the httpOnly cookie (primary) or an Authorization: Bearer
// header (fallback for tooling / non-browser clients), verifies it, and loads
// the user onto req.user.
const verifyToken = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Not authorized, please login first" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        const user = await User.findById(decoded.id).select("-password +sessionId");

        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "User no longer exists" });
        }

        // Single-device login: once the user has an active session, only the
        // token carrying that session id is accepted. A newer login elsewhere
        // rotates the id, so this device's (now stale) token is rejected here.
        if (user.sessionId && decoded.sid !== user.sessionId) {
            return res.status(401).json({
                success: false,
                code: "SESSION_REVOKED",
                message: "You've been signed out because your account was used on another device.",
            });
        }
        // Don't leak the session id downstream (e.g. via /auth/me).
        user.sessionId = undefined;

        req.user = user;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ success: false, message: "Not authorized, token failed" });
    }
};

// Like verifyToken, but never rejects: it attaches req.user when a valid token
// is present and otherwise leaves it undefined and continues. Used by endpoints
// that serve both signed-in and anonymous callers (e.g. the activity heartbeat,
// which counts anonymous landing-page visits too).
const optionalAuth = async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        const user = await User.findById(decoded.id).select("-password +sessionId");
        // Honour single-device: a stale token (superseded by a newer login) is
        // treated as anonymous rather than attributed to the user.
        if (user && !(user.sessionId && decoded.sid !== user.sessionId)) {
            user.sessionId = undefined;
            req.user = user;
        }
    } catch {
        /* invalid token → treat as anonymous */
    }
    next();
};

module.exports = { verifyToken, optionalAuth };
