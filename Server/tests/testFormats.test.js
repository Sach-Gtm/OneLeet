// Tests the locked test-formats: a Quick Shot must have EXACTLY 10 questions to
// publish (Real Exam 100, etc.), a custom test has no lock, and the seeded
// Analogy Quick Shot publishes once with 10 questions.
// Run: node tests/testFormats.test.js
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
const { ensureAnalogyTestSeeded } = require("../src/config/seedAnalogyTest");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];
const qs = (n) => Array.from({ length: n }, (_, i) => ({ text: `Q${i + 1}`, options: ["A", "B", "C", "D"], correctIndex: 0 }));

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "superadmin", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local",
    });
    const adminToken = generateToken(admin._id);
    const studentToken = generateToken(student._id);

    // Draft a Quick Shot with only 5 questions.
    const draft = await request.post("/api/studio/tests").set(...auth(adminToken)).send({
        title: "QS", format: "quick-shot", questions: qs(5),
    });
    assert.strictEqual(draft.status, 201, "draft created");
    assert.strictEqual(draft.body.test.format, "quick-shot", "format stored");
    const id = draft.body.test._id;

    // Can't publish a Quick Shot with the wrong count.
    const bad = await request.post(`/api/studio/tests/${id}/publish`).set(...auth(adminToken));
    assert.strictEqual(bad.status, 400, "publish rejected at 5 questions");
    assert.ok(/exactly 10/.test(bad.body.message), "message states the required count");
    ok("a Quick Shot cannot be published with fewer than 10 questions");

    // Fix to exactly 10, then it publishes.
    await request.patch(`/api/studio/tests/${id}`).set(...auth(adminToken)).send({ questions: qs(10) });
    const good = await request.post(`/api/studio/tests/${id}/publish`).set(...auth(adminToken));
    assert.strictEqual(good.status, 200, "publishes at exactly 10");
    ok("a Quick Shot publishes when it has exactly 10 questions");

    // Too MANY is also rejected — try to publish a Real Exam with 10.
    const re = await request.post("/api/studio/tests").set(...auth(adminToken)).send({ title: "RE", format: "real-exam", questions: qs(10) });
    const reBad = await request.post(`/api/studio/tests/${re.body.test._id}/publish`).set(...auth(adminToken));
    assert.strictEqual(reBad.status, 400, "real-exam needs 100");
    assert.ok(/exactly 100/.test(reBad.body.message));
    ok("a Real Exam Mode needs exactly 100 questions (more/fewer is blocked)");

    // A custom test (no format) has no lock.
    const custom = await request.post("/api/studio/tests").set(...auth(adminToken)).send({ title: "Custom", questions: qs(3) });
    const cPub = await request.post(`/api/studio/tests/${custom.body.test._id}/publish`).set(...auth(adminToken));
    assert.strictEqual(cPub.status, 200, "custom test publishes with any count");
    assert.strictEqual(custom.body.test.format, null, "custom has no format");
    ok("a custom test (no format) has no count lock");

    // The published tests carry their format to students.
    const list = (await request.get("/api/tests").set(...auth(studentToken))).body.tests;
    assert.ok(list.some((t) => t.format === "quick-shot"), "students receive the format");
    ok("the format is exposed to students (for badges/filters)");

    // Seed the Analogy Quick Shot: exactly the format's count, published, once.
    await ensureAnalogyTestSeeded();
    const analogy = await Test.findOne({ format: "quick-shot", title: /Analogy/ }).populate("questions");
    assert.ok(analogy, "analogy test seeded");
    assert.strictEqual(analogy.questions.length, TEST_FORMATS["quick-shot"].count, "seeded with exactly 10 questions");
    assert.strictEqual(analogy.isPublished, true, "published");
    ok("the Analogy Quick Shot test is seeded (published, exactly 10 questions)");

    await ensureAnalogyTestSeeded();
    assert.strictEqual(await Test.countDocuments({ title: /Analogy/ }), 1, "no duplicate on re-seed");
    ok("re-seeding the Analogy test is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} test-format checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FORMATS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
