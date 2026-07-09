const mongoose = require("mongoose");

// A "PYQ" here is a past-year paper (PDF) with rich metadata so the archive can
// be filtered by year / state exam / branch / subject / difficulty. Structured
// MCQ questions (interactive Practice) will be layered on later as a separate
// model related to this one — hence questionsCount, which stays 0 until then.
const PyqSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [140, "Title too long"],
        },
        year: {
            type: Number,
            required: [true, "Year is required"],
            min: [1990, "Year looks invalid"],
            max: [2100, "Year looks invalid"],
            index: true,
        },
        stateExam: {
            // e.g. "All India", "Delhi CET", "Punjab LEET", "Haryana LEET",
            // "UP CET", "Rajasthan LEEP". Kept as a free string (indexed) rather
            // than an enum so new exams don't require a schema change.
            type: String,
            required: [true, "State exam is required"],
            trim: true,
            index: true,
        },
        branch: {
            type: String,
            trim: true,
            index: true,
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            index: true,
        },
        topic: {
            type: String,
            trim: true,
            maxlength: [120, "Topic too long"],
        },
        difficulty: {
            type: String,
            enum: ["easy", "moderate", "hard"],
            default: "moderate",
            index: true,
        },
        tag: {
            // small pill on the card
            type: String,
            enum: ["conceptual", "numerical", "theory"],
            default: "conceptual",
        },
        questionsCount: {
            type: Number,
            default: 0, // populated once structured questions are attached
        },

        // Cloudinary PDF — optional so metadata-only sample papers are valid.
        fileUrl: { type: String },
        publicId: { type: String, index: true },
        fileSize: { type: Number },
        mimeType: { type: String, default: "application/pdf" },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Common filter/sort combinations
PyqSchema.index({ year: -1, stateExam: 1 });
PyqSchema.index({ subject: 1, difficulty: 1 });
PyqSchema.index({ title: "text", topic: "text" });

module.exports = mongoose.model("Pyq", PyqSchema);
