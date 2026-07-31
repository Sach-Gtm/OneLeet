// Verifies the Engineering Mechanics practice sets seed with the right sizes,
// as practice mode with a topic (for the chapter filter), and are idempotent.
// Run: node tests/mechanicsTests.test.js
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
const { TESTS, ensureMechanicsTestsSeeded } = require("../src/config/seedMechanicsTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    assert.strictEqual(TESTS.length, 7, "seven Mechanics chapter sets");
    const sizes = TESTS.map((t) => t.questions.length);
    assert.deepStrictEqual(sizes, [10, 20, 15, 15, 15, 10, 10], "expected per-chapter sizes");
    const all = TESTS.flatMap((t) => t.questions);
    assert.strictEqual(all.length, 95, "95 Mechanics questions in total");
    all.forEach((q, i) => {
        assert.ok(q.text && q.text.trim(), `Q${i + 1} text`);
        assert.ok(q.options.length >= 2 && q.options.length <= 6, `Q${i + 1} option count`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} explanation`);
    });
    ok("seven sets well-formed (sizes 10/20/15/15/15/10/10 = 95, valid keys, explanations)");

    await ensureMechanicsTestsSeeded();
    for (const t of TESTS) {
        const doc = await Test.findOne({ title: t.title }).populate("questions");
        assert.ok(doc, `${t.slug} seeded`);
        assert.strictEqual(doc.questions.length, t.questions.length, `${t.slug} question count`);
        assert.strictEqual(doc.mode, "practice", `${t.slug} is practice mode`);
        assert.strictEqual(doc.subject, "Mechanics", `${t.slug} subject`);
        assert.strictEqual(doc.topic, t.topic, `${t.slug} carries its chapter topic`);
        assert.strictEqual(doc.format, t.format || null, `${t.slug} format`);
        assert.ok(doc.isPublished && !doc.closeAt, `${t.slug} published & lifetime`);
        doc.questions.forEach((qq) => assert.ok(qq.subject === "Mechanics" && qq.topic === t.topic && qq.correctIndex < qq.options.length));
    }
    ok("seven Mechanics sets seed as published practice with a chapter topic");

    assert.strictEqual(await Question.countDocuments({ subject: "Mechanics" }), 95, "95 questions inserted");
    ok("95 Mechanics questions inserted");

    await ensureMechanicsTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ subject: "Mechanics" }), 7, "no duplicates on re-seed");
    assert.strictEqual(await Question.countDocuments({ subject: "Mechanics" }), 95, "no duplicate questions on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} mechanics checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ MECHANICS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
