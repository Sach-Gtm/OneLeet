const mongoose = require("mongoose");

// A structured multiple-choice question — the unit that Mock Tests are built
// from, and (later) interactive PYQ Practice and the AI question generator.
const QuestionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, "Question text is required"],
            trim: true,
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: (a) => Array.isArray(a) && a.length >= 2 && a.length <= 6,
                message: "A question must have between 2 and 6 options",
            },
        },
        correctIndex: {
            type: Number,
            required: [true, "correctIndex is required"],
            min: 0,
        },
        subject: { type: String, trim: true, index: true },
        topic: { type: String, trim: true },
        difficulty: {
            type: String,
            enum: ["easy", "moderate", "hard"],
            default: "moderate",
            index: true,
        },
        explanation: { type: String, trim: true },
        marks: { type: Number, default: 1, min: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Guard against a correctIndex that points outside the options array.
QuestionSchema.pre("validate", async function () {
    if (Array.isArray(this.options) && this.correctIndex >= this.options.length) {
        this.invalidate("correctIndex", "correctIndex is out of range for the options");
    }
});

module.exports = mongoose.model("Question", QuestionSchema);
