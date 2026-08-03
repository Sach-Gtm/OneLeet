const crypto = require("crypto");
const User = require("../models/userModel");
const generateToken = require("./generateToken");
const { buildCookieOptions, SEVEN_DAYS } = require("./authCookie");

// A fresh, unguessable session id.
const newSid = () => crypto.randomBytes(24).toString("hex");

// Start (or move) the user's single active session onto THIS device: rotate the
// session id — invalidating any other device's token — record the device, then
// issue + set the auth cookie/token. Uses updateOne so it never re-validates or
// needs the (deselected) password field. Returns the new token.
async function startSession(res, req, user) {
    const sid = newSid();
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                sessionId: sid,
                sessionDevice: {
                    userAgent: String((req.headers && req.headers["user-agent"]) || "").slice(0, 300),
                    loginAt: new Date(),
                },
            },
        }
    );
    const token = generateToken(user._id, sid);
    res.cookie("token", token, buildCookieOptions(SEVEN_DAYS));
    return token;
}

// End the current session (logout): rotate the session id to one no token holds,
// so the just-used token can't be replayed.
async function endSession(userId) {
    if (!userId) return;
    await User.updateOne({ _id: userId }, { $set: { sessionId: newSid() } }).catch(() => {});
}

module.exports = { startSession, endSession, newSid };
