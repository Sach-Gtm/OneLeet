const mongoose = require("mongoose");

// A notification shown in the bell. By default it's a broadcast to every user;
// when `recipients` is non-empty it's targeted to only those users (e.g. the
// participants of a specific test). Read state is tracked per-user via `readBy`
// (a user is "unread" until their id is added).
const NotificationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        body: { type: String, required: true, trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        // Empty/absent → global broadcast. Non-empty → shown only to these users.
        recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
        // Optional deep-link context (a topper/leaderboard notification links to
        // the test's result screen).
        type: { type: String, enum: ["broadcast", "leaderboard"], default: "broadcast" },
        test: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
