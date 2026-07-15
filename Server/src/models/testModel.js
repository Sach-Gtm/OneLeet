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
        // How students experience it:
        //   test     → answers hidden until the window closes, ranking after
        //   practice → the correct answer is revealed the moment they answer
        mode: {
            type: String,
            enum: ["test", "practice"],
            default: "test",
            index: true,
        },
        // Optional scheduled window (graded tests). While open, answers/ranking
        // stay hidden; after closeAt they unlock. Empty = always open.
        openAt: { type: Date },
        closeAt: { type: Date },
        // Draft → published lifecycle for the Content Studio. `isPublished`
        // stays the visibility flag students' queries use; `status` drives the
        // mentor review workflow (draft is editable, not shown to students).
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "published",
            index: true,
        },
        questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
        totalMarks: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
