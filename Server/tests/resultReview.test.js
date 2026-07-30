// Verifies the results review survives the author editing/deleting the test's
// questions (the attempt snapshots each question), the getAttempt payload carries
// the snapshot + test.mode, and the one-time quick-shot window cleanup works.
// Run: node tests/resultReview.test.js
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
const Question = require("../src/models/questionModel");
const generateToken = require("../src/utils/generateToken");
const { ensureQuickShotWindowsCleared } = require("../src/config/seedReasoningQuickShots");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const student = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local" });
    const adminT = generateToken(admin._id);
    const studentT = generateToken(student._id);

    // A practice test with two questions.
    const q1 = await Question.create({ text: "Bee : Hive :: Bird : ?", options: ["Sky", "Nest", "Tree", "Egg"], correctIndex: 1, explanation: "A hive is a bee's home; a nest is a bird's.", createdBy: admin._id });
    const q2 = await Question.create({ text: "2 + 2 = ?", options: ["3", "4", "5"], correctIndex: 1, explanation: "Basic arithmetic.", createdBy: admin._id });
    const test = await Test.create({ title: "Analogy — Quick Shot", mode: "practice", format: "quick-shot", durationMinutes: 10, questions: [q1._id, q2._id], totalMarks: 2, status: "published", isPublished: true, targets: [], createdBy: admin._id });

    // Student takes it (1 right, 1 wrong).
    const sub = await request.post(`/api/tests/${test._id}/submit`).set(...auth(studentT)).send({
        answers: [{ questionId: String(q1._id), selectedIndex: 1 }, { questionId: String(q2._id), selectedIndex: 0 }],
    });
    assert.strictEqual(sub.status, 201, "submit ok");
    const attemptId = sub.body.attemptId;

    // The attempt review is fully available right away.
    let review = (await request.get(`/api/attempts/${attemptId}`).set(...auth(studentT))).body.attempt;
    assert.strictEqual(review.answers.length, 2, "two answers");
    assert.strictEqual(review.answers[0].text, "Bee : Hive :: Bird : ?", "question text snapshotted");
    assert.deepStrictEqual(review.answers[0].options, ["Sky", "Nest", "Tree", "Egg"], "options snapshotted");
    assert.strictEqual(review.answers[0].correctIndex, 1, "correct index snapshotted");
    assert.strictEqual(review.answers[0].explanation, "A hive is a bee's home; a nest is a bird's.", "explanation snapshotted");
    assert.strictEqual(review.answers[0].correct, true, "Q1 marked correct");
    assert.strictEqual(review.answers[1].correct, false, "Q2 marked wrong");
    assert.strictEqual(review.test.mode, "practice", "test.mode present (drives Retake vs See-Result)");
    ok("the review shows each question, the student's answer, the right answer & explanation");

    // The author now REPLACES the test's questions (as Studio edit does).
    await request.patch(`/api/studio/tests/${test._id}`).set(...auth(adminT)).send({
        questions: [{ text: "New Q", options: ["X", "Y"], correctIndex: 0 }],
    });
    assert.strictEqual(await Question.countDocuments({ _id: q1._id }), 0, "old question deleted by the edit");

    // The past attempt's review STILL renders from its snapshot.
    review = (await request.get(`/api/attempts/${attemptId}`).set(...auth(studentT))).body.attempt;
    assert.strictEqual(review.answers[0].text, "Bee : Hive :: Bird : ?", "review survives the question being deleted");
    assert.strictEqual(review.answers[0].correctIndex, 1, "still knows the correct answer");
    ok("the review survives the author editing/deleting the test's questions");

    // One-time cleanup strips a stray competitive window off a quick-shot warm-up.
    const future = new Date(Date.now() + 275 * 864e5);
    await Test.updateOne({ _id: test._id }, { mode: "test", closeAt: future, openAt: new Date() });
    await ensureQuickShotWindowsCleared();
    const cleaned = await Test.findById(test._id).lean();
    assert.ok(!cleaned.closeAt, "closeAt cleared on the quick-shot");
    assert.ok(!cleaned.openAt, "openAt cleared on the quick-shot");
    ok("the one-time cleanup removes a stray competitive window from a Quick Shot");

    // Idempotent re-run (and it won't wipe a window set AFTER the flag exists).
    await Test.updateOne({ _id: test._id }, { closeAt: future });
    await ensureQuickShotWindowsCleared();
    assert.ok((await Test.findById(test._id).lean()).closeAt, "re-run is a no-op (flag already set)");
    ok("the cleanup is one-time (won't clobber a window set later)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} result-review checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ RESULT REVIEW TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
