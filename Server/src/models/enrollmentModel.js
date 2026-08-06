const mongoose = require("mongoose");

// A student's (free) enrollment in a Course. This is the source of truth for
// which exam-codes a student may see content for: server read paths derive the
// accessible exam-codes from a student's active enrollments. `examCode` is
// denormalized from the course at enroll time so the hot read path skips a join.
// (Enrollment is free, so there's no payment lifecycle here — free-vs-premium is
// a separate per-content flag.)
const EnrollmentSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
        examCode: { type: String, required: true, index: true },
        status: { type: String, enum: ["active", "cancelled"], default: "active", index: true },
    },
    { timestamps: true }
);

// A student can't enroll in the same course twice.
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
