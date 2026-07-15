const mongoose = require("mongoose");

// Emails that may NOT hold an account. When an admin removes someone, their
// email lands here so they can't simply re-register (as a student) and slip back
// in. A Super Admin can lift a block at any time. Manual blocks are allowed too.
const BlocklistSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        reason: { type: String, default: "Removed by an administrator" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Blocklist", BlocklistSchema);
