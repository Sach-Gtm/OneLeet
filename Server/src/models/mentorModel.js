const mongoose = require("mongoose");

// A mentor profile shown on the public Mentors page, each with its own animated
// "journey" detail page (/mentor/:slug). Admin-managed: an admin can add, edit
// or remove a mentor and everything on their journey. The founding mentors are
// seeded on first boot (see config/seedMentors.js) and their rich journeys are
// filled in by a one-time migration (config/seedMentorJourneys.js) so the page
// is never empty.

// A single animated stat tile on the journey page, e.g. { value: "54", label:
// "IPU LEET All-India Rank" }.
const StatSchema = new mongoose.Schema(
    {
        value: { type: String, trim: true, maxlength: 24 },
        label: { type: String, trim: true, maxlength: 48 },
    },
    { _id: false }
);

// An outbound link shown as a button, e.g. { label: "viboraonline.in", url: … }.
const LinkSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true, maxlength: 48 },
        url: { type: String, trim: true, maxlength: 300 },
    },
    { _id: false }
);

const MentorSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"], trim: true, maxlength: [80, "Name too long"] },
        // URL key for the journey detail page (/mentor/:slug). Unique; generated
        // from the name when omitted. Sparse so legacy records without one don't
        // clash while the migration backfills them.
        slug: { type: String, trim: true, lowercase: true, maxlength: 90, index: true, unique: true, sparse: true },
        // Their role at OneLeet, e.g. "Founder & Head Mentor", "Mentor".
        role: { type: String, trim: true, maxlength: [80, "Role too long"] },
        // What they cleared, e.g. "IPU LEET — AIR 54".
        exam: { type: String, trim: true, maxlength: [80, "Value too long"] },
        // Short headline shown on the card + journey hero.
        tagline: { type: String, trim: true, maxlength: [200, "Tagline too long"] },
        // Short blurb for the card.
        description: { type: String, trim: true, maxlength: [600, "Description too long"] },
        // The long-form journey narrative (paragraphs separated by blank lines).
        story: { type: String, trim: true, maxlength: [8000, "Story too long"] },
        // Punchy achievement bullets.
        highlights: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
        // Animated stat tiles.
        stats: { type: [StatSchema], default: [] },
        // Outbound links (personal site, ventures…).
        links: { type: [LinkSchema], default: [] },
        // Optional social handle (shown under the name).
        handle: { type: String, trim: true, maxlength: [60, "Handle too long"] },
        // Cloudinary-hosted photo; falls back to gradient initials on the card.
        photo: {
            url: { type: String, trim: true },
            publicId: { type: String, trim: true },
        },
        published: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Mentor", MentorSchema);
