// Verifies a Cloudflare Turnstile token on sensitive auth routes (login,
// register). CAPTCHA is OPT-IN: it only enforces when TURNSTILE_ENABLED="true"
// AND a secret is configured. This prevents a stray secret from blocking every
// login when the frontend widget isn't set up to send a token — turn it on only
// once BOTH the backend secret (TURNSTILE_SECRET) and the frontend site key
// (VITE_TURNSTILE_SITE_KEY) are in place, then set TURNSTILE_ENABLED=true.
//
// The frontend sends the token as `turnstileToken` in the body (or an
// `x-turnstile-token` header). This runs BEFORE request validation, which
// strips the field.
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
const TURNSTILE_ENABLED = process.env.TURNSTILE_ENABLED === "true";
const VERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(req, res, next) {
    if (!TURNSTILE_ENABLED || !TURNSTILE_SECRET) return next(); // CAPTCHA off → skip

    const token =
        (req.body && req.body.turnstileToken) ||
        req.headers["x-turnstile-token"];
    if (!token) {
        return res
            .status(400)
            .json({ success: false, message: "Please complete the CAPTCHA." });
    }

    try {
        const params = new URLSearchParams();
        params.append("secret", TURNSTILE_SECRET);
        params.append("response", token);
        if (req.ip) params.append("remoteip", req.ip);

        const r = await fetch(VERIFY_URL, { method: "POST", body: params });
        const data = await r.json();
        if (!data.success) {
            // Surface Cloudflare's reason in the logs so misconfigurations are
            // debuggable (e.g. hostname-mismatch → the widget's allowed
            // hostnames don't include this domain; invalid-input-secret → the
            // Secret Key doesn't match the Site Key; timeout-or-duplicate → the
            // token was already used or expired). No secrets are logged.
            const codes = data["error-codes"] || [];
            console.warn("[turnstile] verification failed:", codes.join(", "));
            return res.status(400).json({
                success: false,
                message: "CAPTCHA verification failed. Please try again.",
            });
        }
        return next();
    } catch (e) {
        // Don't lock users out if Cloudflare is unreachable — log and fail open.
        console.error("[turnstile] verify error:", e.message);
        return next();
    }
}

module.exports = { verifyTurnstile };
