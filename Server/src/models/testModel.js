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
        // Optional chapter/topic label (e.g. "Friction") — drives the chapter
        // filter on the Tests page. Backfilled from the questions for older tests.
        topic: { type: String, trim: true, index: true },
        stateExam: { type: String, trim: true },
        // Which LEET exams / universities this test is for (codes from
        // config/exams.js). Empty or ["all"] → shown to every student.
        targets: { type: [String], default: [], index: true },
        category: {
            type: String,
            enum: ["full-mock", "subject-wise", "topic-wise"],
            default: "subject-wise",
        },
        // Fixed-size format (see config/testFormats.js). When set, the test is
        // locked to that format's exact question count. null = a custom test.
        format: {
            type: String,
            enum: ["quick-shot", "practice", "challenge", "survivor", "real-exam", null],
            default: null,
            index: true,
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
        // Access tier. Free by default; staff flip any item to premium with one
        // click. Premium items stay VISIBLE to everyone (shown locked) but only
        // pro-plan students (and staff) can open them — see config/roles.isPremiumUser.
        premium: { type: Boolean, default: false, index: true },
        // Competitive leaderboard lifecycle. A test is "competitive" when it is a
        // graded test (mode==="test") with a `closeAt`. Its ranking stays frozen
        // until ~5 minutes after closeAt, then is finalised exactly once — at
        // which point ranks, achievements and the topper notification are written
        // and `leaderboardPublished` flips true.
        leaderboardPublished: { type: Boolean, default: false, index: true },
        leaderboardPublishedAt: { type: Date },
        // Lifecycle-notification markers (audit M4), each set exactly once by an
        // atomic claim so a "went live" / "2 hours left" alert never double-fires,
        // even across scheduler ticks or instance restarts.
        liveNotifiedAt: { type: Date },
        closingSoonNotifiedAt: { type: Date },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
