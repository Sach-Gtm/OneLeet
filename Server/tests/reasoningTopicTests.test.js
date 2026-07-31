// Verifies the nine topic-wise Reasoning sets seed with the right sizes, formats
// and modes, have valid answer keys, and are idempotent.
// Run: node tests/reasoningTopicTests.test.js
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
const { TEST_FORMATS } = require("../src/config/testFormats");
const { TESTS, ensureReasoningTopicTestsSeeded } = require("../src/config/seedReasoningTopicTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    // Well-formed before touching the DB: sizes match the format, answer keys valid.
    assert.strictEqual(TESTS.length, 9, "nine topic sets");
    for (const t of TESTS) {
        const need = TEST_FORMATS[t.format].count;
        assert.strictEqual(t.questions.length, need, `${t.slug} has ${need} questions`);
        t.questions.forEach((q, i) => {
            assert.ok(q.text && q.text.trim(), `${t.slug} Q${i + 1} has text`);
            assert.ok(q.options.length >= 2 && q.options.length <= 6, `${t.slug} Q${i + 1} option count`);
            assert.strictEqual(new Set(q.options).size, q.options.length, `${t.slug} Q${i + 1} distinct options`);
            assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `${t.slug} Q${i + 1} answer in range`);
            assert.ok(q.explanation && q.explanation.trim(), `${t.slug} Q${i + 1} has explanation`);
        });
    }
    assert.strictEqual(TESTS.reduce((a, t) => a + t.questions.length, 0), 135, "135 questions in total");
    ok("all nine pools well-formed (correct sizes, distinct options, valid keys, explanations; 135 total)");

    await ensureReasoningTopicTestsSeeded();
    for (const t of TESTS) {
        const doc = await Test.findOne({ title: t.title }).populate("questions");
        assert.ok(doc, `${t.slug} seeded`);
        assert.strictEqual(doc.questions.length, TEST_FORMATS[t.format].count, `${t.slug} question count`);
        assert.strictEqual(doc.format, t.format, `${t.slug} format`);
        assert.strictEqual(doc.mode, t.mode, `${t.slug} mode`);
        assert.strictEqual(doc.isPublished, true, `${t.slug} published`);
        assert.ok(!doc.closeAt, `${t.slug} lifetime (no close window)`);
        doc.questions.forEach((qq) => assert.ok(qq.topic === t.topic && qq.subject === "Reasoning" && qq.correctIndex < qq.options.length));
    }
    const graded = TESTS.filter((t) => t.mode === "test").length;
    const practice = TESTS.filter((t) => t.mode === "practice").length;
    ok(`nine sets seeded with correct size/format/mode (${graded} graded tests, ${practice} practice drills)`);

    const totalQ = await Question.countDocuments({ subject: "Reasoning" });
    assert.strictEqual(totalQ, 135, "135 reasoning questions inserted");
    ok("135 questions inserted and attributed to the topic");

    await ensureReasoningTopicTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /^Reasoning: / }), 9, "no duplicates on re-seed");
    assert.strictEqual(await Question.countDocuments({ subject: "Reasoning" }), 135, "no duplicate questions on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} reasoning-topic checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ REASONING TOPIC TESTS FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
