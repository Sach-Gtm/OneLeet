// Guards a route to users whose role is in the allowed list. Must run after
// verifyToken (which sets req.user).
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Forbidden: you don't have permission to do this",
        });
    }
    next();
};

module.exports = { requireRole };
