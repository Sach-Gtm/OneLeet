const mongoose = require("mongoose");

// A mock test: a titled, timed set of questions.
const TestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [140, "Title too long"],
        },
        description: { type: String, trim: true, maxlength: [400, "Description too long"] },
        subject: { type: String, trim: true, index: true },
        stateExam: { type: String, trim: true },
        category: {
            type: String,
            enum: ["full-mock", "subject-wise", "topic-wise"],
            default: "subject-wise",
        },
        durationMinutes: {
            type: Number,
            required: true,
            default: 30,
            min: [1, "Duration must be at least 1 minute"],
        },
        questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
        totalMarks: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
