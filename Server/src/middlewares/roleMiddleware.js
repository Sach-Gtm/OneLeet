// Guards a route to users whose role is in the allowed list. Must run after
// verifyToken (which sets req.user).
const { STAFF, ADMINS, SUPERADMINS } = require("../config/roles");

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: you don't have permission to do this",
        });
    }
    next();
};

// Named gates for the three permission groups (see config/roles.js). Use these
// instead of spelling out role strings so a capability's audience is defined
// once. Finer-grained rules that depend on the *target* user (e.g. "an admin
// may remove a student but not a mentor") live in the controller, not here.
const requireStaff = requireRole(...STAFF); // content + notifications
const requireAdmin = requireRole(...ADMINS); // student data + inbox
const requireSuperadmin = requireRole(...SUPERADMINS); // premium, staff removal

module.exports = { requireRole, requireStaff, requireAdmin, requireSuperadmin };
