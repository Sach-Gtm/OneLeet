const mongoose = require("mongoose");

// A landing-page testimonial for the "Success Wall". Base shapes:
//   • "text"  — a written review.
//   • "image" — an uploaded screenshot/photo (portrait; e.g. a WhatsApp chat).
//   • "video" — an uploaded clip; plays inline.
// Any review can also carry optional student details (exam / rank / college /
// branch) and be promoted to a "case" — a full success story ("how I helped
// them") with its own crawlable page at /success/:slug for SEO. Admin-managed
// only; nothing is seeded, so the wall stays empty until a real review is added.
const ReviewSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["text", "image", "video"], default: "text", index: true },
        // The written review (required for "text"; an optional caption otherwise).
        text: { type: String, trim: true, maxlength: [600, "Review too long"] },
        // Subject / title — mainly for image/video reviews ("what this is about").
        title: { type: String, trim: true, maxlength: [160, "Title too long"] },
        // The student's name (shown with their details).
        author: { type: String, trim: true, maxlength: [100, "Name too long"] },

        // Optional student details — all optional, shown in the full view / case.
        exam: { type: String, trim: true, maxlength: [80, "Value too long"] },
        rank: { type: String, trim: true, maxlength: [40, "Value too long"] },
        college: { type: String, trim: true, maxlength: [120, "Value too long"] },
        branch: { type: String, trim: true, maxlength: [80, "Value too long"] },

        // For video reviews: the uploaded clip, hosted on Cloudinary.
        video: {
            url: { type: String, trim: true },
            publicId: { type: String, trim: true },
        },
        // For image reviews: the uploaded screenshot/photo (portrait), on Cloudinary.
        image: {
            url: { type: String, trim: true },
            publicId: { type: String, trim: true },
        },

        // ── Success case (SEO story) — filled behind the admin "Write case" toggle ──
        isCase: { type: Boolean, default: false, index: true },
        // URL key for the case's own page (/success/:slug). Unique; generated from
        // the name/title. Sparse so non-case reviews (no slug) don't clash.
        slug: { type: String, trim: true, lowercase: true, maxlength: 90, index: true, unique: true, sparse: true },
        // Catchy headline for the case page.
        caseTitle: { type: String, trim: true, maxlength: [160, "Title too long"] },
        // The full "how I helped them" narrative (paragraphs separated by blank lines).
        caseStory: { type: String, trim: true, maxlength: [8000, "Story too long"] },

        published: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewSchema);
