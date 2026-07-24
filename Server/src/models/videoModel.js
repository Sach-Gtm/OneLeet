const mongoose = require("mongoose");

// A curated YouTube lecture, embedded and played INSIDE OneLeet (staff never
// send students off to youtube.com). Organised subject → chapter (unit) → topic
// so students browse the way they actually study — chapter-wise, topic-wise.
// We keep only the 11-char `youtubeId`, extracted from whatever URL staff paste,
// so the in-site player embeds reliably.
const VideoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title too long"],
        },
        youtubeId: {
            type: String,
            required: [true, "A YouTube video is required"],
            trim: true,
            maxlength: [40, "Invalid video id"],
        },
        // Subject / course this belongs to (e.g. "Discrete Mathematics"). Used as
        // the top grouping and the subject filter on the Videos page.
        subject: { type: String, trim: true, maxlength: [80, "Subject too long"], index: true },
        // Chapter / unit label (e.g. "Unit 1 — Set Theory").
        chapter: { type: String, trim: true, maxlength: [120, "Chapter too long"] },
        // Finer topic label (optional).
        topic: { type: String, trim: true, maxlength: [160, "Topic too long"] },
        description: { type: String, trim: true, maxlength: [1000, "Description too long"] },
        // Original creator credit shown on the card (channel/teacher name).
        author: { type: String, trim: true, maxlength: [80, "Author too long"], default: "OneLeet" },
        // Which LEET exams / universities this video is for (codes from
        // config/exams.js). Empty or ["all"] → shown to every student.
        targets: { type: [String], default: [], index: true },
        published: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
