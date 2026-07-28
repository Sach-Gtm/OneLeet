const mongoose = require("mongoose");

// A mentor profile shown on the public Mentors page. Admin-managed: an admin can
// add a mentor (with a photo + optional description) and remove one. The three
// founding mentors are seeded on first boot (see config/seedMentors.js) so the
// page is never empty.
const MentorSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"], trim: true, maxlength: [80, "Name too long"] },
        // What they cleared, e.g. "IPU LEET 2024".
        exam: { type: String, trim: true, maxlength: [80, "Value too long"] },
        // Optional bio / anything the admin wants to say about them.
        description: { type: String, trim: true, maxlength: [600, "Description too long"] },
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
