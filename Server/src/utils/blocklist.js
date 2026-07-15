const Blocklist = require("../models/blocklistModel");

// Is this email blocked from holding an account? Used at every entry point that
// could create or authenticate an account (register, login, Google sign-in).
async function isEmailBlocked(email) {
    if (!email) return false;
    const e = String(email).toLowerCase().trim();
    if (!e) return false;
    return !!(await Blocklist.findOne({ email: e }).lean());
}

module.exports = { isEmailBlocked };
