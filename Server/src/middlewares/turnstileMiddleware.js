// Verifies a Cloudflare Turnstile token on sensitive auth routes (login,
// register). Graceful: when TURNSTILE_SECRET is unset the check is skipped, so
// the app works without CAPTCHA until you configure it — then it turns on.
//
// The frontend sends the token as `turnstileToken` in the body (or an
// `x-turnstile-token` header). This runs BEFORE request validation, which
// strips the field.
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
const VERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(req, res, next) {
    if (!TURNSTILE_SECRET) return next(); // CAPTCHA not configured → skip

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
