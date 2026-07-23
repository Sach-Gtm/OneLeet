const mongoose = require("mongoose");

// A single studyable topic inside a chapter. `estimatedHours` is set by staff
// and shown to students; `_id` is stable and is what a student's progress marks
// as completed (so edits that preserve _ids keep progress intact).
const TopicSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: [200, "Topic title too long"] },
        estimatedHours: { type: Number, default: 0, min: 0, max: 500 },
        order: { type: Number, default: 0 },
    },
    { _id: true }
);

const ChapterSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: [200, "Chapter title too long"] },
        order: { type: Number, default: 0 },
        topics: { type: [TopicSchema], default: [] },
    },
    { _id: true }
);

// A syllabus is created per subject (e.g. "Mathematics", "Basic Electrical").
// Staff author it — by hand, by AI-refining pasted text, or by scanning an
// uploaded PDF — and students track topic-by-topic completion against it.
const SyllabusSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, "Title is required"], trim: true, maxlength: [120, "Title too long"] },
        subject: { type: String, trim: true, maxlength: [60, "Subject too long"], index: true },
        exam: { type: String, trim: true, default: "LEET", maxlength: [60, "Value too long"] },
        description: { type: String, trim: true, maxlength: [500, "Description too long"] },
        chapters: { type: [ChapterSchema], default: [] },
        published: { type: Boolean, default: true, index: true },
        // "global": staff-authored, shown to every student. "personal": a student's
        // own syllabus, visible only to them. AI authoring (refine/scan) is
        // staff-only, so personal syllabi are always built by hand.
        scope: { type: String, enum: ["global", "personal"], default: "global", index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Syllabus", SyllabusSchema);
