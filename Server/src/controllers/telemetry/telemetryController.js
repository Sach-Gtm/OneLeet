const ErrorLog = require("../../models/errorLogModel");

const clip = (s, n) => (typeof s === "string" ? s.slice(0, n) : undefined);

// Persist one captured error, best-effort. NEVER throws — observability must not
// take down the request (or process) it's observing. This is also the single
// place to later tee errors to Sentry/PostHog when a DSN env is set.
async function saveError(doc = {}) {
    try {
        await ErrorLog.create({
            source: doc.source,
            message: clip(doc.message, 1000) || "",
            stack: clip(doc.stack, 6000),
            url: clip(doc.url, 500),
            method: clip(doc.method, 10),
            statusCode: typeof doc.statusCode === "number" ? doc.statusCode : undefined,
            userAgent: clip(doc.userAgent, 400),
            release: clip(doc.release, 60),
            user: doc.user || undefined,
            meta: doc.meta && typeof doc.meta === "object" ? doc.meta : undefined,
        });
    } catch {
        // Swallow: a failing error-logger must not loop or crash anything.
    }
}

// Fire-and-forget capture of a server-side 5xx, called from the central error
// handler. Do NOT await this in the request path.
function logServerError(err, req, statusCode) {
    if (!err) return;
    saveError({
        source: "server",
        message: err.message || String(err),
        stack: err.stack,
        url: req && req.originalUrl,
        method: req && req.method,
        statusCode,
        userAgent: req && req.get && req.get("user-agent"),
        user: req && req.user && req.user._id,
    });
}

// POST /api/telemetry/client-error — a browser crash report (optionalAuth, so a
// logged-in user is attributed; anonymous landing crashes are captured too).
async function reportClientError(req, res) {
    const b = req.body || {};
    await saveError({
        source: "client",
        message: b.message,
        stack: b.stack,
        url: b.url,
        release: b.release,
        userAgent: req.get && req.get("user-agent"),
        user: req.user && req.user._id,
        meta: b.meta,
    });
    return res.status(204).end();
}

module.exports = { saveError, logServerError, reportClientError };
