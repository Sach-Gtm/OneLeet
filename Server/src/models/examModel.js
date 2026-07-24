const mongoose = require("mongoose");

// A LEET exam / university in the catalog. Admins manage these from the Admin
// panel; the change is global (all targeting pickers + student filters read the
// live catalog). Seeded once from config/exams.js SEED_EXAMS.
const ExamSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [60, "Code too long"],
        },
        name: { type: String, required: [true, "Name is required"], trim: true, maxlength: [120, "Name too long"] },
        group: { type: String, trim: true, default: "Other", maxlength: [60, "Group too long"] },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Exam", ExamSchema);
