const mongoose = require("mongoose");

// A landing-page testimonial. Two shapes share one strip:
//   • "text"  — a written review (message + optional name/role).
//   • "video" — a YouTube review with a subject/title; plays inside OneLeet.
// Admin-managed only; nothing is seeded, so the strip stays empty until a real
// review is added.
const ReviewSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["text", "video"], default: "text", index: true },
        // The written review (required for "text"; an optional caption for "video").
        text: { type: String, trim: true, maxlength: [600, "Review too long"] },
        // Subject / title — mainly for video reviews ("what this review is about").
        title: { type: String, trim: true, maxlength: [160, "Title too long"] },
        // Who gave it (name / college / role) — optional.
        author: { type: String, trim: true, maxlength: [100, "Name too long"] },
        // For video reviews: the uploaded clip, hosted on Cloudinary and played
        // inline on the site (no external link).
        video: {
            url: { type: String, trim: true },
            publicId: { type: String, trim: true },
        },
        published: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
