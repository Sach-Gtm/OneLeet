const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
    {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedIndex: { type: Number, default: null }, // null = unattempted
        correct: { type: Boolean, default: false },
    },
    { _id: false }
);

// A user's completed attempt at a test — the source of truth for scoring,
// the results breakdown, and the stats that flow to the dashboard.
const AttemptSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
        testTitle: { type: String }, // denormalised for history/activity display
        answers: [AnswerSchema],
        score: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        correctCount: { type: Number, default: 0 },
        incorrectCount: { type: Number, default: 0 },
        unattemptedCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }, // percentage of attempted that were correct
        durationTakenSeconds: { type: Number, default: 0 },
        startedAt: { type: Date },
        submittedAt: { type: Date },
        // Final leaderboard position within this attempt's test, written once the
        // test's leaderboard is finalised. Only each user's best attempt per test
        // is ranked; every other attempt (and any non-competitive test) stays null.
        rank: { type: Number, default: null },
    },
    { timestamps: true }
);

AttemptSchema.index({ user: 1, submittedAt: -1 });
// Finalisation groups attempts by test and picks each user's best.
AttemptSchema.index({ test: 1, score: -1 });

module.exports = mongoose.model("Attempt", AttemptSchema);
