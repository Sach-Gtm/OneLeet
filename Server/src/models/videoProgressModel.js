const mongoose = require("mongoose");

// A student's watch progress on one video: the furthest point they reached
// (watchedSeconds), the video length, the resulting percent, and whether it's
// marked complete (auto near the end, or manually — and reversible). One row per
// (user, video).
const VideoProgressSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
        watchedSeconds: { type: Number, default: 0, min: 0 },
        durationSeconds: { type: Number, default: 0, min: 0 },
        percent: { type: Number, default: 0, min: 0, max: 100 },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

VideoProgressSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model("VideoProgress", VideoProgressSchema);
