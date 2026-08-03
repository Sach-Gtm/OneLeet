const jwt = require("jsonwebtoken");

// Signs a JWT whose payload is { id, sid }. `sid` is the user's current session
// id (single-device login): the auth middleware rejects a token whose sid no
// longer matches the user's active session, so a fresh login on another device
// logs the old one out. `sid` is optional — older tokens / direct callers omit
// it and still work while the user has no active session set.
const generateToken = (id, sid) =>
    jwt.sign({ id, sid }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

module.exports = generateToken;
