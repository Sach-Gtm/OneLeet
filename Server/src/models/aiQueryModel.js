const mongoose = require("mongoose");

// One row per AI Tools request, so we can show "most searched topics in the
// last 24h" (topic names only) and, per student, what they've asked the AI.
// We store just the lightweight metadata (tool + subject/topic/difficulty), not
// the full generated content.
const AiQuerySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        tool: { type: String, default: "questions" }, // questions | flashcards | summary | plan | ...
        subject: { type: String, default: "", maxlength: 120 },
        topic: { type: String, default: "", maxlength: 120 },
        difficulty: { type: String, default: "" },
    },
    { timestamps: true }
);

AiQuerySchema.index({ createdAt: -1 });
AiQuerySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AiQuery", AiQuerySchema);
