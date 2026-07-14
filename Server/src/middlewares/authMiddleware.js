const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { SUPERADMIN_EMAIL } = require("../config/roles");

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "User no longer exists" });
        }

        // Self-heal: promote a pre-existing Super Admin account (created before
        // this rule, or demoted) exactly once. The guard means this only writes
        // until the role is correct, then never again.
        if (user.email === SUPERADMIN_EMAIL && user.role !== "superadmin") {
            user.role = "superadmin";
            await user.save({ validateBeforeSave: false });
        }

        req.user = user;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ success: false, message: "Not authorized, token failed" });
    }
};

module.exports = { verifyToken };
