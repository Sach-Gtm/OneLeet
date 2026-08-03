const mongoose = require("mongoose");

// One "section" of the paper (e.g. Mathematics), with the topics it covers, its
// question/mark weight and a difficulty read. Kept as a sub-document array so an
// admin can add as many sections as an exam actually has.
const SectionSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: [80, "Section name too long"] },
        subjects: { type: String, trim: true, maxlength: [500, "Too long"] },
        questions: { type: Number, min: 0, max: 2000 },
        marks: { type: Number, min: 0, max: 20000 },
        difficulty: {
            type: String,
            enum: { values: ["Easy", "Moderate", "Hard", ""], message: "Invalid difficulty" },
            default: "",
        },
    },
    { _id: false }
);

// A notable college that admits through this exam, with its typical placement —
// the "where can this exam take me" payoff a student cares about.
const CollegeSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: [140, "Too long"] },
        location: { type: String, trim: true, maxlength: [120, "Too long"] },
        avgPackage: { type: String, trim: true, maxlength: [60, "Too long"] },
    },
    { _id: false }
);

// One university/college's seat intake under this exam — how many seats it
// offers (optionally per branch/course), so a student can gauge their chances.
// Kept a sub-document array so an admin can list every participating college.
const SeatIntakeSchema = new mongoose.Schema(
    {
        college: { type: String, trim: true, maxlength: [140, "Too long"] },
        course: { type: String, trim: true, maxlength: [140, "Too long"] },
        seats: { type: Number, min: 0, max: 100000 },
        note: { type: String, trim: true, maxlength: [200, "Too long"] },
    },
    { _id: false }
);

// Everything a student needs to understand a LEET exam at a glance: eligibility,
// fees, the section-wise paper pattern with marking scheme, and the colleges +
// placements it leads to. Admin-managed; matched to a student by `examCode`
// (a code from config/exams.js) so each student sees the patterns for the exams
// they picked in their profile.
const ExamPatternSchema = new mongoose.Schema(
    {
        // Links to the exam catalog + a student's chosen `exams` (userModel).
        examCode: {
            type: String,
            required: [true, "Pick which exam this pattern is for"],
            trim: true,
            index: true,
        },
        // Display name, e.g. "IPU LEET (GGSIPU)".
        examName: { type: String, required: [true, "Exam name is required"], trim: true, maxlength: [140, "Too long"] },
        // Who conducts it, e.g. "GGSIPU".
        conductingBody: { type: String, trim: true, maxlength: [140, "Too long"] },
        // Where it applies, e.g. "Delhi NCR".
        place: { type: String, trim: true, maxlength: [140, "Too long"] },
        eligibility: { type: String, trim: true, maxlength: [2000, "Too long"] },
        fees: { type: String, trim: true, maxlength: [400, "Too long"] },
        // "Online (CBT)" / "Offline (OMR)".
        examMode: { type: String, trim: true, maxlength: [80, "Too long"] },
        // "2 hours", "150 minutes", etc.
        duration: { type: String, trim: true, maxlength: [80, "Too long"] },
        // The exam date. Drives the live countdown a student sees ("N days to
        // go"); admins set/adjust it as the official date is announced.
        examDate: { type: Date },
        totalQuestions: { type: Number, min: 0, max: 5000 },
        totalMarks: { type: Number, min: 0, max: 100000 },

        sections: { type: [SectionSchema], default: [] },

        // Marking scheme kept as strings ("+4", "-1", "None") so admins can write
        // exactly what the brochure says without us forcing a number format.
        markingCorrect: { type: String, trim: true, maxlength: [40, "Too long"] },
        markingNegative: { type: String, trim: true, maxlength: [40, "Too long"] },
        markingNote: { type: String, trim: true, maxlength: [400, "Too long"] },

        avgPlacement: { type: String, trim: true, maxlength: [80, "Too long"] },
        topColleges: { type: [CollegeSchema], default: [] },

        // University-wise seat intake — the number of seats each participating
        // college/university offers through this exam.
        seatIntake: { type: [SeatIntakeSchema], default: [] },

        // Free text: application window, exam date, result date, counselling, etc.
        importantDates: { type: String, trim: true, maxlength: [800, "Too long"] },
        officialWebsite: { type: String, trim: true, maxlength: [300, "Too long"] },
        // Anything else worth telling the student.
        notes: { type: String, trim: true, maxlength: [2500, "Too long"] },

        published: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ExamPattern", ExamPatternSchema);
