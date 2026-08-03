const mongoose = require("mongoose");

// Records a student's attempt to capture / exfiltrate PREMIUM content — a
// screenshot key, a copy, a print/save, a right-click, dev-tools, or leaving the
// tab while viewing (a common screen-recording tell).
//
// Important: a web page CANNOT truly block an OS-level screenshot or screen
// recording — no browser API grants that. So this layer's real value is
// ATTRIBUTION + DETERRENCE: every premium page is watermarked with the student's
// identity, and every *detectable* attempt is logged here and surfaced to admins
// so they can reach out to the student.
//
// Events are de-duplicated per (user, type, day): repeated attempts of the same
// kind on the same day just bump `count` instead of spawning a new row, so the
// admin view stays readable and admins are notified at most once per
// student/type/day. Rows auto-expire after RETENTION_DAYS.
const RETENTION_DAYS = 120;

const EVENT_TYPES = [
    "screenshot",   // PrintScreen key (Windows) — the only screenshot combo a browser can observe
    "copy",         // copy / cut attempt
    "print",        // Ctrl/Cmd+P or the print dialog (incl. "Save as PDF")
    "save",         // Ctrl/Cmd+S
    "context-menu", // right-click (often the route to "Save image as…")
    "devtools",     // developer tools likely opened
    "tab-hidden",   // switched away while viewing premium content (possible recording / capture)
    "download",     // tried to download a premium asset
];

const SecurityEventSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Identity snapshot so the admin list needs no populate and still names
        // the student even if the account is later removed.
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },

        type: { type: String, enum: EVENT_TYPES, required: true },
        day: { type: String, required: true }, // "YYYY-MM-DD" bucket for de-dup

        count: { type: Number, default: 0 },

        // What was being viewed (best-effort, reported by the client).
        contentType: { type: String, trim: true, maxlength: 40 }, // note | test | prep-guide | video | general
        contentRef: { type: String, trim: true, maxlength: 200 }, // id / slug / title
        path: { type: String, trim: true, maxlength: 200 },       // route/URL path
        userAgent: { type: String, trim: true, maxlength: 300 },

        firstAt: { type: Date },
        lastAt: { type: Date },
    },
    { timestamps: true }
);

// One row per student + attempt-type + day; repeats just bump `count`.
SecurityEventSchema.index({ user: 1, type: 1, day: 1 }, { unique: true });
// Newest-first admin listing.
SecurityEventSchema.index({ lastAt: -1 });
// Auto-expire old rows so the collection can't grow without bound.
SecurityEventSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 }
);

const SecurityEvent = mongoose.model("SecurityEvent", SecurityEventSchema);
SecurityEvent.EVENT_TYPES = EVENT_TYPES;
module.exports = SecurityEvent;
