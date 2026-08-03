// Verifies the second Applied Mathematics batch: 4 chapters (Sets, Matrices &
// Determinants, Sequences & Series, Basic Calculus), each in BOTH a repeatable
// practice and a single-attempt graded "test" flavour, with DIFFERENT questions
// per flavour. 8 sets × 10 Q = 80. Quick Shot, 25-min, all exams, idempotent.
// Run: node tests/appliedMathAdvancedTests.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

require("../app");
const User = require("../src/models/userModel");
const Test = require("../src/models/testModel");
const Question = require("../src/models/questionModel");
const { TESTS, ensureAppliedMathAdvancedTestsSeeded } = require("../src/config/seedAppliedMathAdvancedTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    assert.strictEqual(TESTS.length, 8, "eight sets (4 chapters × practice + test)");
    const chapters = ["Sets", "Matrices & Determinants", "Sequences & Series", "Basic Calculus"];
    chapters.forEach((c) => {
        const forChapter = TESTS.filter((t) => t.topic === c);
        assert.strictEqual(forChapter.length, 2, `${c} has two flavours`);
        assert.deepStrictEqual(forChapter.map((t) => t.mode).sort(), ["practice", "test"], `${c} has a practice and a test`);
    });
    ok("each of the 4 chapters ships a practice + a single-attempt graded test");

    const all = TESTS.flatMap((t) => t.questions);
    assert.strictEqual(all.length, 80, "80 questions in total");
    all.forEach((q, i) => {
        assert.ok(q.text && q.text.trim(), `Q${i + 1} text`);
        assert.ok(q.options.length >= 2 && q.options.length <= 6, `Q${i + 1} option count`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} explanation`);
    });
    ok("eight sets well-formed (8 × 10 = 80, valid answer keys, explanations)");

    // Practice and graded flavours of a chapter must NOT share question text
    // (otherwise the practice spoils the graded test).
    chapters.forEach((c) => {
        const [a, b] = TESTS.filter((t) => t.topic === c);
        const overlap = a.questions.map((q) => q.text).filter((tx) => b.questions.some((q) => q.text === tx));
        assert.strictEqual(overlap.length, 0, `${c}: practice and test share no questions`);
    });
    ok("within each chapter, the practice and graded sets use different questions");

    // Answer keys aren't parked on one option.
    TESTS.forEach((t) => {
        const spread = new Set(t.questions.map((q) => q.correctIndex));
        assert.ok(spread.size >= 3, `${t.slug} answers spread across options`);
    });
    ok("each set spreads its correct answers across at least three option positions");

    await ensureAppliedMathAdvancedTestsSeeded();
    for (const t of TESTS) {
        const doc = await Test.findOne({ title: t.title }).populate("questions");
        assert.ok(doc, `${t.slug} seeded`);
        assert.strictEqual(doc.questions.length, 10, `${t.slug} has 10 questions`);
        assert.strictEqual(doc.mode, t.mode, `${t.slug} mode is ${t.mode}`);
        assert.strictEqual(doc.subject, "Mathematics", `${t.slug} subject is Mathematics`);
        assert.strictEqual(doc.topic, t.topic, `${t.slug} carries its chapter topic`);
        assert.strictEqual(doc.format, "quick-shot", `${t.slug} is a Quick Shot`);
        assert.strictEqual(doc.durationMinutes, 25, `${t.slug} is a 25-minute set`);
        assert.deepStrictEqual(doc.targets, [], `${t.slug} is open to all exams`);
        // Graded tests have no closeAt → lifetime access + a live leaderboard.
        assert.ok(doc.isPublished && !doc.closeAt, `${t.slug} published & lifetime`);
    }
    ok("eight sets seed with the right mode, 25-min, Mathematics, all exams");

    const titles = TESTS.map((t) => t.title);
    const beforeQ = await Question.countDocuments({ subject: "Mathematics" });
    await ensureAppliedMathAdvancedTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: { $in: titles } }), 8, "no duplicate tests on re-seed");
    assert.strictEqual(await Question.countDocuments({ subject: "Mathematics" }), beforeQ, "no duplicate questions on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} applied-math-advanced checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ APPLIED MATH ADVANCED TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
