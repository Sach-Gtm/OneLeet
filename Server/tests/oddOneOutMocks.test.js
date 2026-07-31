// Verifies the two graded Odd One Out mocks seed (40 Challenge + 50 Survivor,
// mode "test", lifetime access, well-formed answer keys), are idempotent, and
// share no question with the Classification mocks (so the two topics stay
// distinct tests). Run: node tests/oddOneOutMocks.test.js
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
const { ODDONEOUT_CHALLENGE, ODDONEOUT_SURVIVOR, ensureOddOneOutMockTestsSeeded } = require("../src/config/seedOddOneOutMockTests");
const { CLASSIFICATION_CHALLENGE, CLASSIFICATION_SURVIVOR } = require("../src/config/seedClassificationMockTests");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const norm = (opts) => opts.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")).sort().join("|");

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    // Well-formed before touching the DB.
    assert.strictEqual(ODDONEOUT_CHALLENGE.length, 40, "challenge pool is 40");
    assert.strictEqual(ODDONEOUT_SURVIVOR.length, 50, "survivor pool is 50");
    const all = [...ODDONEOUT_CHALLENGE, ...ODDONEOUT_SURVIVOR];
    all.forEach((q, i) => {
        assert.ok(q.text && q.options.length >= 4 && q.options.length <= 5, `Q${i + 1} shape`);
        assert.strictEqual(new Set(q.options).size, q.options.length, `Q${i + 1} distinct options`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} has an explanation`);
    });
    ok("both pools are well-formed (40/50, distinct options, valid answer key, explanation)");

    // No question repeats within Odd One Out, and none collides with a
    // Classification question — the two topics must feel like different tests.
    const ownKeys = all.map((q) => norm(q.options));
    assert.strictEqual(new Set(ownKeys).size, ownKeys.length, "no repeats within Odd One Out");
    const classKeys = new Set([...CLASSIFICATION_CHALLENGE, ...CLASSIFICATION_SURVIVOR].map((q) => norm(q.options)));
    all.forEach((q, i) => assert.ok(!classKeys.has(norm(q.options)), `Q${i + 1} not a Classification duplicate`));
    ok("all 90 questions are unique and none duplicates a Classification mock");

    await ensureOddOneOutMockTestsSeeded();
    const challenge = await Test.findOne({ format: "challenge", title: /Odd One Out/ }).populate("questions");
    const survivor = await Test.findOne({ format: "survivor", title: /Odd One Out/ }).populate("questions");
    assert.ok(challenge && survivor, "both seeded");
    assert.strictEqual(challenge.questions.length, 40, "challenge has 40 questions");
    assert.strictEqual(survivor.questions.length, 50, "survivor has 50 questions");
    assert.strictEqual(challenge.mode, "test", "graded");
    assert.ok(!challenge.closeAt, "lifetime (no close window)");
    assert.strictEqual(survivor.isPublished, true, "published");
    challenge.questions.forEach((qq) => assert.ok(qq.topic === "Odd One Out" && qq.correctIndex < qq.options.length));
    ok("40-question Challenge + 50-question Survivor odd-one-out mocks seed (graded, lifetime)");

    await ensureOddOneOutMockTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /Odd One Out/, format: { $in: ["challenge", "survivor"] } }), 2, "no duplicates on re-seed");
    ok("re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} odd-one-out-mock checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ODD ONE OUT MOCKS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
