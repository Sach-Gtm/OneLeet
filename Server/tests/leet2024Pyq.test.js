// Verifies the 2024 LEET PYQ seeds as a 100-question PRACTICE-mode full mock
// (every question a well-formed MCQ with a valid answer key + explanation) and
// that re-seeding is idempotent. Run: node tests/leet2024Pyq.test.js
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
const { LEET_2024, ensureLeet2024PyqSeeded } = require("../src/config/seedLeet2024Pyq");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    // Well-formed before touching the DB: 100 four-option MCQs, distinct
    // options, valid answer key, and an explanation on every question.
    assert.strictEqual(LEET_2024.length, 100, "exactly 100 questions");
    LEET_2024.forEach((q, i) => {
        assert.ok(q.text && q.text.trim(), `Q${i + 1} has text`);
        assert.strictEqual(q.options.length, 4, `Q${i + 1} has 4 options`);
        assert.strictEqual(new Set(q.options).size, 4, `Q${i + 1} distinct options`);
        assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, `Q${i + 1} answer in range`);
        assert.ok(q.explanation && q.explanation.trim(), `Q${i + 1} has an explanation`);
        assert.ok(q.subject && q.topic, `Q${i + 1} tagged with subject + topic`);
    });
    ok("all 100 questions are well-formed 4-option MCQs with a valid key + explanation");

    // The answer key isn't degenerate (not all the same option).
    assert.ok(new Set(LEET_2024.map((q) => q.correctIndex)).size === 4, "answer key uses all four positions");
    ok("answer key spreads across all four options (a/b/c/d)");

    await ensureLeet2024PyqSeeded();
    const test = await Test.findOne({ title: /LEET 2024/ }).populate("questions");
    assert.ok(test, "PYQ test seeded");
    assert.strictEqual(test.mode, "practice", "practice mode (tick reveals the answer)");
    assert.strictEqual(test.format, "real-exam", "real-exam format (100)");
    assert.strictEqual(test.category, "full-mock", "full mock");
    assert.strictEqual(test.questions.length, 100, "100 questions attached");
    assert.deepStrictEqual(test.targets, [], "untargeted → visible to every student");
    assert.strictEqual(test.isPublished, true, "published");
    assert.strictEqual(test.premium, false, "free by default");
    test.questions.forEach((qq) => assert.ok(qq.correctIndex < qq.options.length, "answer key in range in DB"));
    ok("seeds one 100-question practice-mode 'Exam Ready' PYQ, published & free, visible to all");

    await ensureLeet2024PyqSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /LEET 2024/ }), 1, "no duplicate on re-seed");
    ok("re-seeding is a no-op (idempotent SeedFlag)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} LEET-2024-PYQ checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ LEET 2024 PYQ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
