const mongoose = require("mongoose");

// A Course is a college-wise batch (e.g. "IPU LEET 2027 Foundation Batch") that a
// student ENROLLS in. Enrolling grants access to that batch's exam-code content;
// enrollment is FREE — the price/mrp fields are display-only marketing for the
// pricing page, and free-vs-premium stays a per-item flag on the content itself.
// A course maps to exactly ONE exam-code (from config/exams.js — never "all").
const CourseSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Course name is required"], trim: true, maxlength: 140 },
        slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
        examCode: { type: String, required: [true, "examCode is required"], trim: true, index: true },
        examName: { type: String, trim: true }, // denormalized label from the catalog
        tagline: { type: String, trim: true, maxlength: 200 },
        description: { type: String, default: "", maxlength: 4000 },
        // Bullet points shown on the course overview page ("What's inside").
        whatsInside: { type: [String], default: [] },
        termsAndConditions: { type: String, default: "", maxlength: 8000 },
        coverImage: { url: String, publicId: String }, // Cloudinary, like notes/pyqs
        // Commerce is display-only in this phase (enrollment is free); the pricing
        // page wires the real payment later.
        price: { type: Number, default: 0, min: 0 },
        mrp: { type: Number, default: 0, min: 0 },
        seatCap: { type: Number, default: 0, min: 0 }, // 0 = unlimited
        startDate: { type: Date },
        order: { type: Number, default: 0 },
        // Unlike Test, courses default UNPUBLISHED — admins publish deliberately.
        published: { type: Boolean, default: false, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
