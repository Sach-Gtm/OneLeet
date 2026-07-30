// Verifies the two graded analogy mocks seed (40 Challenge + 50 Survivor, mode
// "test", lifetime access) and that a lifetime test's leaderboard is LIVE the
// moment a student finishes (non-competitive → status "published" immediately).
// Run: node tests/analogyMocks.test.js
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
const { ensureAnalogyMockTestsSeeded } = require("../src/config/seedAnalogyMockTests");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const student = await User.create({ name: "Aarav", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local" });
    const studentT = generateToken(student._id);

    await ensureAnalogyMockTestsSeeded();

    const challenge = await Test.findOne({ format: "challenge", title: /Analogy/ }).populate("questions");
    const survivor = await Test.findOne({ format: "survivor", title: /Analogy/ }).populate("questions");
    assert.ok(challenge && survivor, "both mocks seeded");
    assert.strictEqual(challenge.questions.length, 40, "challenge has 40 questions");
    assert.strictEqual(survivor.questions.length, 50, "survivor has 50 questions");
    assert.strictEqual(challenge.mode, "test", "challenge is graded");
    assert.ok(!challenge.closeAt, "challenge has no close window (lifetime access)");
    assert.strictEqual(challenge.isPublished, true, "published");
    // Every seeded question's answer key is in range.
    challenge.questions.forEach((q) => assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length));
    ok("40-question Challenge + 50-question Survivor analogy mocks seed (graded, lifetime)");

    // A student takes the challenge (all correct).
    const answers = challenge.questions.map((q) => ({ questionId: String(q._id), selectedIndex: q.correctIndex }));
    const sub = await request.post(`/api/tests/${challenge._id}/submit`).set(...auth(studentT)).send({ answers });
    assert.strictEqual(sub.status, 201, "submit accepted");
    assert.strictEqual(sub.body.score, 40, "scored 40/40");

    // Its leaderboard is LIVE right away (non-competitive, no waiting).
    const lb = (await request.get(`/api/leaderboard/test/${challenge._id}`).set(...auth(studentT))).body;
    assert.strictEqual(lb.status, "published", "board is live, not pending");
    assert.strictEqual(lb.competitive, false, "lifetime test is not competitive");
    assert.ok(lb.total >= 1 && lb.me.attempted && lb.me.rank === 1, "the finisher is ranked #1 immediately");
    assert.ok(lb.leaderboard.some((r) => r.isCurrentUser), "they appear on the board");
    ok("a lifetime test's leaderboard is live the moment you finish");

    // Re-seeding is a no-op.
    await ensureAnalogyMockTestsSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /Analogy/, format: { $in: ["challenge", "survivor"] } }), 2, "no duplicates on re-seed");
    ok("re-seeding the analogy mocks is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} analogy-mock checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ANALOGY MOCKS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
