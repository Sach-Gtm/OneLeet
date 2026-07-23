const mongoose = require("mongoose");

// One row per (student, syllabus): the set of topic _ids that student has ticked
// off. Kept separate from the Syllabus doc so many students track the same
// syllabus without contention, and so wiping a syllabus is cheap.
const SyllabusProgressSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        syllabus: { type: mongoose.Schema.Types.ObjectId, ref: "Syllabus", required: true, index: true },
        completedTopics: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    },
    { timestamps: true }
);

SyllabusProgressSchema.index({ user: 1, syllabus: 1 }, { unique: true });

module.exports = mongoose.model("SyllabusProgress", SyllabusProgressSchema);
