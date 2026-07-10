const nodemailer = require("nodemailer");

// Email delivery is optional infra (OTP + password-reset). It supports two
// transports, chosen by which env vars are set:
//
//   1. Brevo HTTP API (BREVO_API_KEY)  — sends over HTTPS, so it works on hosts
//      that block outbound SMTP (e.g. Render's free tier). PREFERRED in prod.
//   2. Gmail SMTP (EMAIL_USER + EMAIL_PASS app password) — fine locally / on
//      hosts that allow SMTP. Used only when Brevo isn't configured.
//
// With neither set, email is off: signup stays active without OTP and reset
// links are logged instead of sent.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// The visible/sender address. In Brevo this must be a *verified sender*. Falls
// back to EMAIL_USER so the Gmail address you already configured is reused.
const FROM_EMAIL = (process.env.EMAIL_FROM_EMAIL || EMAIL_USER || "").trim();
const FROM_NAME = process.env.EMAIL_FROM_NAME || "OneLeet";

function provider() {
    if (BREVO_API_KEY && FROM_EMAIL) return "brevo";
    if (EMAIL_USER && EMAIL_PASS) return "smtp";
    return null;
}

function isEmailConfigured() {
    return provider() !== null;
}

// ---- Brevo (HTTP) ----------------------------------------------------------
async function sendViaBrevo({ to, subject, html, text }) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text,
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Brevo ${res.status}: ${body.slice(0, 200)}`);
    }
    return { ok: true, provider: "brevo" };
}

// ---- Gmail SMTP (fallback) -------------------------------------------------
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
            connectionTimeout: 10000,
            greetingTimeout: 8000,
            socketTimeout: 15000,
        });
    }
    return transporter;
}

async function sendViaSmtp({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM || `${FROM_NAME} <${EMAIL_USER}>`;
    return getTransporter().sendMail({ from, to, subject, html, text });
}

// ---- Public API ------------------------------------------------------------
async function sendMail({ to, subject, html, text }) {
    const p = provider();
    if (!p) {
        console.log(
            `[email] not configured — skipped "${subject}" to ${to}. ` +
                `Set BREVO_API_KEY (recommended) or EMAIL_USER + EMAIL_PASS.`
        );
        return { skipped: true };
    }
    return p === "brevo"
        ? sendViaBrevo({ to, subject, html, text })
        : sendViaSmtp({ to, subject, html, text });
}

// Cached "can we actually deliver right now?" flag. OTP is gated on this so a
// configured-but-unreachable transport (e.g. Gmail SMTP on Render, which is
// blocked) never locks users out of signup — it just falls back to no-OTP.
let deliverable = false;

function canSendEmail() {
    return deliverable;
}

async function refreshDeliverability() {
    if (!isEmailConfigured()) {
        deliverable = false;
        return false;
    }
    try {
        const r = await verifyTransport();
        deliverable = !!r.canConnect;
        if (!deliverable) {
            console.warn(
                `[email] ${r.provider} transport cannot deliver (${r.error}). ` +
                    `OTP is disabled until this is fixed; signups stay open.`
            );
        } else {
            console.log(`[email] ${r.provider} transport ready — OTP enabled.`);
        }
    } catch (e) {
        deliverable = false;
        console.warn(`[email] deliverability check failed: ${e.message}`);
    }
    return deliverable;
}

// Verify now and re-check periodically so config/network changes are picked up
// without a redeploy.
function startEmailHealthChecks() {
    const first = refreshDeliverability();
    const timer = setInterval(refreshDeliverability, 5 * 60 * 1000);
    if (timer.unref) timer.unref();
    return first;
}

// Confirms the configured transport can actually deliver from this host.
async function verifyTransport() {
    const p = provider();
    if (!p) return { configured: false, canConnect: false };
    if (p === "brevo") {
        try {
            const res = await fetch("https://api.brevo.com/v3/account", {
                headers: { "api-key": BREVO_API_KEY, accept: "application/json" },
            });
            return res.ok
                ? { configured: true, provider: "brevo", canConnect: true }
                : {
                      configured: true,
                      provider: "brevo",
                      canConnect: false,
                      error: `Brevo ${res.status}`,
                  };
        } catch (e) {
            return {
                configured: true,
                provider: "brevo",
                canConnect: false,
                error: e.message,
            };
        }
    }
    try {
        await getTransporter().verify();
        return { configured: true, provider: "smtp", canConnect: true };
    } catch (e) {
        return {
            configured: true,
            provider: "smtp",
            canConnect: false,
            error: e.message,
        };
    }
}

module.exports = {
    sendMail,
    isEmailConfigured,
    verifyTransport,
    canSendEmail,
    refreshDeliverability,
    startEmailHealthChecks,
};
