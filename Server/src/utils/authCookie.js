// Central place for the auth cookie options so login / register / google /
// logout all agree.
//
// Two production modes:
//   • Cross-site (default): frontend and API sit on different registrable
//     domains (e.g. Vercel front-end + api.onrender.com). The cookie must be
//     SameSite=None; Secure to survive the cross-site request.
//   • First-party: set COOKIE_DOMAIN (e.g. ".oneleet.in") once the site and API
//     share a registrable domain (site oneleet.in + API api.oneleet.in). The
//     cookie then becomes SameSite=Lax; Domain=.oneleet.in — first-party, which
//     browsers treat far more reliably than the cross-site None cookie. Only
//     turn this on after the site is fully served from oneleet.in (not the
//     .vercel.app URL), otherwise Lax would drop the cookie on the old origin
//     (login still works there via the Bearer token, but the cookie wouldn't).
// Locally (non-prod) we always use Lax with no domain.
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const buildCookieOptions = (maxAgeMs) => {
    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
    const firstParty = isProd && !!cookieDomain;
    const options = {
        httpOnly: true,
        secure: isProd,
        sameSite: firstParty ? "lax" : isProd ? "none" : "lax",
        path: "/",
    };
    // Scope the cookie to the parent domain so it's shared by the site and the
    // api subdomain. Included on the clear-cookie call too (logout spreads these
    // same options), so the domain matches and the cookie actually clears.
    if (cookieDomain) options.domain = cookieDomain;
    if (typeof maxAgeMs === "number") options.maxAge = maxAgeMs;
    return options;
};

module.exports = { buildCookieOptions, SEVEN_DAYS };
