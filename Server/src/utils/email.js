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
            // Fail fast instead of hanging if the host blocks/slows SMTP ports.
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 15000,
        });
    }
    return transporter;
}

// Diagnostic: checks the SMTP connection + credentials without sending mail.
// Used by the email-health endpoint so we can confirm delivery works from the
// deployed host (some platforms block outbound SMTP).
async function verifyTransport() {
    const tx = getTransporter();
    if (!tx) return { configured: false, canConnect: false };
    try {
        await tx.verify();
        return { configured: true, canConnect: true };
    } catch (e) {
        return { configured: true, canConnect: false, error: e.message };
    }
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

module.exports = { sendMail, isEmailConfigured, verifyTransport };
