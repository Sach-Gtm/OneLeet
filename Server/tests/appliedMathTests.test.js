// Verifies the Applied Mathematics practice sets: 4 chapter Quick Shots (10 Q)
// on Probability / Permutations / Combinations / Statistics, seeded as
// published practice, subject "Mathematics", 25-minute window, open to all
// exams (targets: []), and idempotent.
// Run: node tests/appliedMathTests.test.js
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
const { TESTS, ensureAppliedMathTestsSeeded } = require("../src/config/seedAppliedMathTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    assert.strictEqual(TESTS.length, 4, "four Applied Maths chapter sets");
    assert.deepStrictEqual(TESTS.map((t) => t.topic), ["Probability", "Permutations", "Combinations", "Statistics"], "expected chapters");
    const all = TESTS.flatMap((t) => t.questions);
    assert.strictEqual(all.length, 40, "40 Applied Maths questions in total");
    all.forEach((q, i) => {
        assert.ok(q.text && q.text.trim(), `Q${i + 1} text`);
        assert.ok(q.options.length >= 2 && q.options.length <= 6, `Q${i + 1} option count`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} explanation`);
    });
    ok("four sets well-formed (4 × 10 = 40, valid answer keys, explanations)");

    // Answer keys aren't parked on one option (guards against a lazy key).
    TESTS.forEach((t) => {
        const spread = new Set(t.questions.map((q) => q.correctIndex));
        assert.ok(spread.size >= 3, `${t.slug} answers spread across options`);
    });
    ok("each set spreads its correct answers across at least three option positions");

    await ensureAppliedMathTestsSeeded();
    for (const t of TESTS) {
        const doc = await Test.findOne({ title: t.title }).populate("questions");
        assert.ok(doc, `${t.slug} seeded`);
        assert.strictEqual(doc.questions.length, 10, `${t.slug} has 10 questions`);
        assert.strictEqual(doc.mode, "practice", `${t.slug} is practice mode`);
        assert.strictEqual(doc.subject, "Mathematics", `${t.slug} subject is Mathematics`);
        assert.strictEqual(doc.topic, t.topic, `${t.slug} carries its chapter topic`);
        assert.strictEqual(doc.format, "quick-shot", `${t.slug} is a Quick Shot`);
        assert.strictEqual(doc.durationMinutes, 25, `${t.slug} is a 25-minute set`);
        assert.deepStrictEqual(doc.targets, [], `${t.slug} is open to all exams`);
        assert.ok(doc.isPublished && !doc.closeAt, `${t.slug} published & lifetime`);
        doc.questions.forEach((qq) => assert.ok(qq.subject === "Mathematics" && qq.topic === t.topic && qq.correctIndex < qq.options.length));
    }
    ok("four sets seed as published 25-min practice, subject Mathematics, all exams");

    const titles = TESTS.map((t) => t.title);
    const beforeQ = await Question.countDocuments({ subject: "Mathematics" });
    await ensureAppliedMathTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: { $in: titles } }), 4, "no duplicate tests on re-seed");
    assert.strictEqual(await Question.countDocuments({ subject: "Mathematics" }), beforeQ, "no duplicate questions on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} applied-math checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ APPLIED MATH TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
