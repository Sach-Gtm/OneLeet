const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./src/routes/user/userRoutes");
const googleAuth = require("./src/routes/user/googleAuth");
const pdfRoutes = require("./src/routes/content/noteRoutes");

// Builds and returns the configured Express app WITHOUT starting a server or
// connecting to the database. server.js wires those up for real runs; tests
// import this directly and drive it with an in-memory database.
const app = express();

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

    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

module.exports = app;
