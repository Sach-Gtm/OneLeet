// Verifies the two graded Classification mocks seed (40 Challenge + 50 Survivor,
// mode "test", lifetime access, well-formed answer keys) and are idempotent.
// Run: node tests/classificationMocks.test.js
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
const { CLASSIFICATION_CHALLENGE, CLASSIFICATION_SURVIVOR, ensureClassificationMockTestsSeeded } = require("../src/config/seedClassificationMockTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    // Well-formed before touching the DB.
    assert.strictEqual(CLASSIFICATION_CHALLENGE.length, 40, "challenge pool is 40");
    assert.strictEqual(CLASSIFICATION_SURVIVOR.length, 50, "survivor pool is 50");
    [...CLASSIFICATION_CHALLENGE, ...CLASSIFICATION_SURVIVOR].forEach((q, i) => {
        assert.ok(q.text && q.options.length >= 4 && q.options.length <= 5, `Q${i + 1} shape`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} has an explanation`);
    });
    ok("both pools are well-formed (40/50, distinct options, valid answer key, explanation)");

    await ensureClassificationMockTestsSeeded();
    const challenge = await Test.findOne({ format: "challenge", title: /Classification/ }).populate("questions");
    const survivor = await Test.findOne({ format: "survivor", title: /Classification/ }).populate("questions");
    assert.ok(challenge && survivor, "both seeded");
    assert.strictEqual(challenge.questions.length, 40, "challenge has 40 questions");
    assert.strictEqual(survivor.questions.length, 50, "survivor has 50 questions");
    assert.strictEqual(challenge.mode, "test", "graded");
    assert.ok(!challenge.closeAt, "lifetime (no close window)");
    assert.strictEqual(survivor.isPublished, true, "published");
    challenge.questions.forEach((qq) => assert.ok(qq.topic === "Classification" && qq.correctIndex < qq.options.length));
    ok("40-question Challenge + 50-question Survivor classification mocks seed (graded, lifetime)");

    await ensureClassificationMockTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /Classification/, format: { $in: ["challenge", "survivor"] } }), 2, "no duplicates on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} classification-mock checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ CLASSIFICATION MOCKS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
