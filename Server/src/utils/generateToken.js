const jwt = require("jsonwebtoken");

// Signs a JWT whose payload is { id }. IMPORTANT: the auth middleware reads
// `decoded.id`, so anything that verifies a token must sign it through here to
// stay consistent.
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

module.exports = generateToken;
