// Verifies the nine reasoning "Quick Shot" warm-ups seed correctly: one published
// practice test per topic, each locked to exactly 10 well-formed questions, shown
// to every LEET, and idempotent on re-seed.
// Run: node tests/reasoningQuickShots.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const Test = require("../src/models/testModel");
const generateToken = require("../src/utils/generateToken");
const { TEST_FORMATS } = require("../src/config/testFormats");
const { BANKS, ensureReasoningQuickShotsSeeded } = require("../src/config/seedReasoningQuickShots");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];
const COUNT = TEST_FORMATS["quick-shot"].count; // 10

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "superadmin", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    const studentToken = generateToken(student._id);

    // Every bank is structurally sound BEFORE it ever hits the DB: exactly 10
    // questions, 2–6 options, an in-range correctIndex, and an explanation.
    assert.strictEqual(BANKS.length, 9, "nine topic banks");
    for (const bank of BANKS) {
        assert.strictEqual(bank.questions.length, COUNT, `${bank.topic} has exactly ${COUNT} questions`);
        bank.questions.forEach((q, i) => {
            const where = `${bank.topic} Q${i + 1}`;
            assert.ok(q.text && q.text.trim(), `${where} has text`);
            assert.ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 6, `${where} has 2–6 options`);
            assert.ok(new Set(q.options).size === q.options.length, `${where} options are distinct`);
            assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length, `${where} correctIndex in range`);
            assert.ok(q.explanation && q.explanation.trim(), `${where} has an explanation`);
        });
    }
    ok("all 9 banks are well-formed (10 questions, distinct options, valid correctIndex, explanation)");

    // Seed, then assert one published practice Quick Shot per topic.
    await ensureReasoningQuickShotsSeeded();
    const tests = await Test.find({ format: "quick-shot", subject: "Reasoning" }).populate("questions");
    const seeded = tests.filter((t) => /Quick Shot$/.test(t.title));
    assert.ok(seeded.length >= 9, `at least 9 reasoning Quick Shots seeded (got ${seeded.length})`);

    for (const bank of BANKS) {
        const t = seeded.find((x) => x.title === `Reasoning: ${bank.topic}, Quick Shot`);
        assert.ok(t, `${bank.topic} test exists`);
        assert.strictEqual(t.mode, "practice", `${bank.topic} is practice mode`);
        assert.strictEqual(t.isPublished, true, `${bank.topic} is published`);
        assert.strictEqual(t.durationMinutes, 10, `${bank.topic} is 10 minutes`);
        assert.deepStrictEqual(t.targets, [], `${bank.topic} targets all LEETs`);
        assert.strictEqual(t.questions.length, COUNT, `${bank.topic} has exactly ${COUNT} questions`);
        t.questions.forEach((q) => {
            assert.strictEqual(q.subject, "Reasoning");
            assert.strictEqual(q.topic, bank.topic);
            assert.ok(q.correctIndex < q.options.length);
        });
    }
    ok("each topic seeds one published, 10-question practice Quick Shot targeting all LEETs");

    // Students actually receive them (published + untargeted → visible to everyone).
    const list = (await request.get("/api/tests").set(...auth(studentToken))).body.tests;
    const codingAndDecoding = list.find((t) => /Coding & Decoding, Quick Shot/.test(t.title));
    assert.ok(codingAndDecoding, "a seeded Quick Shot reaches the student list");
    assert.strictEqual(codingAndDecoding.format, "quick-shot", "carries the quick-shot format");
    assert.strictEqual(codingAndDecoding.mode, "practice", "carries practice mode");
    assert.strictEqual(codingAndDecoding.questionCount, COUNT, "shows 10 questions");
    ok("the seeded Quick Shots are visible to students with the right format/mode/count");

    // Re-seeding is a no-op (per-topic SeedFlag).
    const before = await Test.countDocuments({ format: "quick-shot" });
    await ensureReasoningQuickShotsSeeded();
    const after = await Test.countDocuments({ format: "quick-shot" });
    assert.strictEqual(before, after, "no duplicates on re-seed");
    ok("re-seeding the reasoning Quick Shots is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} reasoning Quick Shot checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ REASONING QUICK SHOTS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
