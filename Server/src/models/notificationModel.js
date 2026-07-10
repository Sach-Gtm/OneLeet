const mongoose = require("mongoose");

// A broadcast notification created by staff and shown in every user's bell.
// Read state is tracked per-user via `readBy` (a user is "unread" until their
// id is added).
const NotificationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        body: { type: String, required: true, trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
