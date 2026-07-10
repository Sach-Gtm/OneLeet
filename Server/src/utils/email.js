const nodemailer = require("nodemailer");

// Email is optional infrastructure: OTP verification and password-reset links
// are sent through it, but the app must still boot and run when it isn't set up
// yet. Configure by setting EMAIL_USER + EMAIL_PASS (a Gmail address and a Gmail
// "App Password"). EMAIL_FROM overrides the visible From line.
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM =
    process.env.EMAIL_FROM || (EMAIL_USER ? `OneLeet <${EMAIL_USER}>` : undefined);

function isEmailConfigured() {
    return Boolean(EMAIL_USER && EMAIL_PASS);
}

let transporter = null;
function getTransporter() {
    if (!isEmailConfigured()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });
    }
    return transporter;
}

// Never throws to the caller's request flow: if email isn't configured we log
// and no-op; if a real send fails the error propagates so callers can decide.
async function sendMail({ to, subject, html, text }) {
    const tx = getTransporter();
    if (!tx) {
        console.log(
            `[email] not configured — skipped "${subject}" to ${to}. ` +
                `Set EMAIL_USER + EMAIL_PASS to enable.`
        );
        return { skipped: true };
    }
    return tx.sendMail({ from: EMAIL_FROM, to, subject, html, text });
}

module.exports = { sendMail, isEmailConfigured };
