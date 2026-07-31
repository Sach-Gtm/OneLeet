// Verifies the second Engineering Mechanics batch: 5 topic-wise Quick Shots
// (10 Q) + 4 chapter-wise sets (25 Q) = 150 questions, seeded as published
// practice with a topic (for the chapter filter), and idempotent.
// Run: node tests/mechanicsExamTests.test.js
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
const { TESTS, ensureMechanicsExamTestsSeeded } = require("../src/config/seedMechanicsExamTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    assert.strictEqual(TESTS.length, 9, "nine Mechanics exam sets (5 topic + 4 chapter)");
    const sizes = TESTS.map((t) => t.questions.length);
    assert.deepStrictEqual(sizes, [10, 10, 10, 10, 10, 25, 25, 25, 25], "5×10 topic + 4×25 chapter");

    // Quick Shots must lock to 10; the 25-Q chapter sets use the "practice" format.
    TESTS.slice(0, 5).forEach((t) => assert.strictEqual(t.format, "quick-shot", `${t.slug} is a Quick Shot`));
    TESTS.slice(5).forEach((t) => assert.strictEqual(t.format, "practice", `${t.slug} uses the 25-Q practice format`));

    const all = TESTS.flatMap((t) => t.questions);
    assert.strictEqual(all.length, 150, "150 Mechanics exam questions in total");
    all.forEach((q, i) => {
        assert.ok(q.text && q.text.trim(), `Q${i + 1} text`);
        assert.ok(q.options.length >= 2 && q.options.length <= 6, `Q${i + 1} option count`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} explanation`);
    });
    ok("nine sets well-formed (5×10 + 4×25 = 150, valid answer keys, explanations)");

    // Answer keys aren't all parked on one option (guards against a lazy key).
    TESTS.forEach((t) => {
        const spread = new Set(t.questions.map((q) => q.correctIndex));
        assert.ok(spread.size >= 3, `${t.slug} answers spread across options`);
    });
    ok("each set spreads its correct answers across at least three option positions");

    await ensureMechanicsExamTestsSeeded();
    for (const t of TESTS) {
        const doc = await Test.findOne({ title: t.title }).populate("questions");
        assert.ok(doc, `${t.slug} seeded`);
        assert.strictEqual(doc.questions.length, t.questions.length, `${t.slug} question count`);
        assert.strictEqual(doc.mode, "practice", `${t.slug} is practice mode`);
        assert.strictEqual(doc.subject, "Mechanics", `${t.slug} subject`);
        assert.strictEqual(doc.topic, t.topic, `${t.slug} carries its topic/chapter`);
        assert.strictEqual(doc.format, t.format || null, `${t.slug} format`);
        assert.ok(doc.isPublished && !doc.closeAt, `${t.slug} published & lifetime`);
        doc.questions.forEach((qq) => assert.ok(qq.subject === "Mechanics" && qq.topic === t.topic && qq.correctIndex < qq.options.length));
    }
    ok("nine Mechanics exam sets seed as published practice with a topic");

    const examTitles = TESTS.map((t) => t.title);
    const beforeQ = await Question.countDocuments({ subject: "Mechanics" });
    await ensureMechanicsExamTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: { $in: examTitles } }), 9, "no duplicate tests on re-seed");
    assert.strictEqual(await Question.countDocuments({ subject: "Mechanics" }), beforeQ, "no duplicate questions on re-seed");
    ok("re-seeding is a no-op (no duplicate exam tests or questions)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} mechanics-exam checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ MECHANICS EXAM TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
