const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./src/routes/user/userRoutes");
const googleAuth = require("./src/routes/user/googleAuth");
const pdfRoutes = require("./src/routes/content/noteRoutes");
const dashboardRoutes = require("./src/routes/dashboard/dashboardRoutes");
const pyqRoutes = require("./src/routes/content/pyqRoutes");
const studyNotesRoutes = require("./src/routes/content/studyNotesRoutes");
const testRoutes = require("./src/routes/test/testRoutes");
const attemptRoutes = require("./src/routes/test/attemptRoutes");
const aiRoutes = require("./src/routes/ai/aiRoutes");
const leaderboardRoutes = require("./src/routes/leaderboard/leaderboardRoutes");
const communityRoutes = require("./src/routes/community/communityRoutes");
const adminRoutes = require("./src/routes/admin/adminRoutes");
const notificationRoutes = require("./src/routes/notification/notificationRoutes");
const contactRoutes = require("./src/routes/contact/contactRoutes");
const questionRoutes = require("./src/routes/content/questionRoutes");

// Builds and returns the configured Express app WITHOUT starting a server or
// connecting to the database. server.js wires those up for real runs; tests
// import this directly and drive it with an in-memory database.
const app = express();

// Behind Render's proxy: trust the first hop so req.ip is the real client IP
// (used by the rate limiter and Turnstile's remoteip), not the proxy's.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Baseline security headers (helmet-style, no extra dependency). The API only
// serves JSON, so a restrictive CSP and frame denial are safe defaults.
app.use((req, res, next) => {
    res.set({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Cross-Origin-Resource-Policy": "same-site",
    });
    if (process.env.NODE_ENV === "production") {
        res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
});

// CLIENT_URL may be a single origin or a comma-separated list (e.g. localhost
// for dev + the Vercel URL for prod). Falls back to the Vite dev server.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser clients (curl/Postman) that send no Origin.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    })
);
app.use(cookieParser());

// Health check (useful for Railway/Render uptime checks)
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// APIs
app.use("/api/auth", userRoutes);
app.use("/api/auth", googleAuth);
app.use("/api/pdf", pdfRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pyqs", pyqRoutes);
app.use("/api/notes", studyNotesRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/questions", questionRoutes);

// 404 for unmatched routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler (controllers call next(err) to land here)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    if (err && err.name === "ValidationError") {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err && err.code === 11000) {
        return res.status(409).json({ success: false, message: "Duplicate value" });
    }

    // In production, never echo internal error details (stack hints, driver
    // messages, file paths) to the client — log them, return a generic message.
    const status = err.status || 500;
    const isProd = process.env.NODE_ENV === "production";
    const message =
        status >= 500 && isProd
            ? "Something went wrong on our side. Please try again."
            : err.message || "Internal server error";
    return res.status(status).json({ success: false, message });
});

module.exports = app;
