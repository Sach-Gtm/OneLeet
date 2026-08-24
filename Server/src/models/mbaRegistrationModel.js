const mongoose = require("mongoose");

// A student's registration for the "OneLeet MBA" batch. Before they can see the
// MBA Mock PI program on the internal /mba page, they pick their college (an IIM
// or a top B-school). One row per user — a repeat submit just updates the college.
const MbaRegistrationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: { type: String, lowercase: true, trim: true, index: true },
        phone: { type: String, trim: true, maxlength: 20 },
        // The IIM / top B-school the student picked (free text capped, from a
        // curated client list plus an "Other" fallback).
        college: { type: String, required: true, trim: true, maxlength: 120 },
        source: { type: String, trim: true, default: "web" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MbaRegistration", MbaRegistrationSchema);
