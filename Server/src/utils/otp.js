const crypto = require("crypto");

// 6-digit email OTP. We never store the raw code — only its SHA-256 hash — so a
// database read can't reveal active codes.
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends

function generateOtp() {
    return String(crypto.randomInt(100000, 1000000)); // always 6 digits
}

function hashOtp(otp) {
    return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

module.exports = { generateOtp, hashOtp, OTP_TTL_MS, RESEND_COOLDOWN_MS };
