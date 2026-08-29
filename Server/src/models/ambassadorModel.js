const mongoose = require("mongoose");

// An application to the OneLeet Campus Ambassador Program. Its own collection so
// staff can browse / export / triage just the ambassador applicants. One row per
// email — a repeat submit updates it. `status` lets staff run the selection.
const AmbassadorApplicationSchema = new mongoose.Schema(
    {
        // ── Required ──
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
        phone: { type: String, required: true, trim: true, maxlength: 20 },
        college: { type: String, required: true, trim: true, maxlength: 120 },

        // ── Optional (helps shortlisting) ──
        year: { type: String, trim: true, maxlength: 40 },          // e.g. "2nd year diploma"
        socialHandle: { type: String, trim: true, maxlength: 160 }, // Instagram / LinkedIn / etc.
        socialReach: { type: String, trim: true, maxlength: 40 },   // approx followers / reach
        whyJoin: { type: String, trim: true, maxlength: 800 },      // motivation, any language
        work: { type: String, trim: true, maxlength: 600 },         // current work / relevant experience

        // ── Staff / system ──
        status: { type: String, enum: ["new", "shortlisted", "selected", "rejected"], default: "new", index: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // linked account, if applying while logged in
        source: { type: String, trim: true, default: "web" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AmbassadorApplication", AmbassadorApplicationSchema);
