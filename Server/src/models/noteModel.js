const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [120, "Title cannot exceed 120 characters"],
        },
        category: {
            type: String,
            enum: ["pyqs", "important-questions", "notes"],
            required: [true, "Category is required"],
            index: true,
        },
        subject: {
            type: String,
            trim: true,
            maxlength: [50, "Subject name too long"],
            index: true,
        },

        // ---- Study-notes metadata (category: "notes") ----
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description too long"],
        },
        teacher: {
            type: String, // display name, e.g. "Prof. R.K. Gupta"
            trim: true,
            maxlength: [80, "Teacher name too long"],
            index: true,
        },
        branch: { type: String, trim: true, maxlength: [60, "Branch too long"] },
        level: { type: String, trim: true, maxlength: [40, "Level too long"] }, // e.g. "2nd Year"
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate",
            index: true,
        },
        format: {
            type: String,
            enum: ["pdf", "handwritten", "slides", "text"],
            default: "pdf",
            index: true,
        },

        // ---- Written body (category "notes", format "text") ----
        // A note can be a PDF (fileUrl) OR written/AI-drafted content — or both.
        // Markdown is allowed; the reader renders it.
        content: {
            type: String,
            maxlength: [20000, "Note content is too long"],
        },
        // How the written content was authored, so AI-drafted notes can be
        // surfaced/audited. File-only and hand-typed notes are "manual".
        source: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual",
            index: true,
        },

        // ---- File (optional so metadata-only / text-only notes are valid) ----
        fileUrl: { type: String },
        publicId: { type: String, index: true },
        fileSize: { type: Number },
        mimeType: {
            type: String,
            enum: ["application/pdf"],
            default: "application/pdf",
        },

        // Using req.user._id from the verifyToken middleware
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

NoteSchema.index({ category: 1, subject: 1 });
NoteSchema.index({ category: 1, difficulty: 1 });
NoteSchema.index({ uploadedBy: 1 });
NoteSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Note", NoteSchema);
