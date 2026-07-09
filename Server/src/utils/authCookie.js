// Central place for the auth cookie options so login / register / google /
// logout all agree. In production the frontend (Vercel) and backend
// (Railway/Render) are on different domains, so the cookie must be
// SameSite=None; Secure to survive the cross-site request. Locally we use Lax.
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const buildCookieOptions = (maxAgeMs) => {
    const isProd = process.env.NODE_ENV === "production";
    const options = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
    };
    if (typeof maxAgeMs === "number") options.maxAge = maxAgeMs;
    return options;
};

module.exports = { buildCookieOptions, SEVEN_DAYS };
