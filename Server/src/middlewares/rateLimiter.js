// Lightweight in-memory rate limiter (fixed window per IP). Zero dependencies —
// fine for a single-instance deployment (Render). If we ever scale to multiple
// instances, swap the store for Redis; the middleware interface stays the same.
//
// Usage: router.post("/login", rateLimit("login", 20, 15 * 60), ...)
//   -> allows 20 requests per 15 minutes per IP for the "login" bucket.
const buckets = new Map();

// Periodically drop expired windows so memory can't grow unbounded.
const SWEEP_MS = 10 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(key);
    }
}, SWEEP_MS).unref();

function rateLimit(name, max, windowSeconds) {
    const windowMs = windowSeconds * 1000;
    return (req, res, next) => {
        // req.ip honours X-Forwarded-For because app sets `trust proxy`.
        const key = `${name}:${req.ip || "unknown"}`;
        const now = Date.now();
        let entry = buckets.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            buckets.set(key, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.set("Retry-After", String(retryAfter));
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please wait a bit and try again.",
            });
        }
        return next();
    };
}

module.exports = { rateLimit };
