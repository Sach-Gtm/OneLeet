// Verifies the two attempt-integrity rules added for the audit's "dangerous
// issue": (1) a still-open deadline (competitive) test seals its answer key in
// the result review until it closes, and (2) practice attempts persist + stay
// repeatable but never inflate the graded dashboard stats (Tests Taken).
// Run: node tests/resultLock.test.js
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

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const student = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local" });
    const tok = generateToken(student._id);

    const mkQ = () => Question.create({ text: "Q", options: ["A", "B", "C", "D"], correctIndex: 2, explanation: "because C", createdBy: admin._id });
    const [qP, qW, qL] = [await mkQ(), await mkQ(), await mkQ()];

    const practice = await Test.create({ title: "Practice", mode: "practice", durationMinutes: 10, questions: [qP._id], totalMarks: 1, status: "published", isPublished: true, targets: [], createdBy: admin._id });
    const future = new Date(Date.now() + 7 * 864e5);
    const windowed = await Test.create({ title: "Windowed", mode: "test", durationMinutes: 30, questions: [qW._id], totalMarks: 1, status: "published", isPublished: true, targets: [], closeAt: future, createdBy: admin._id });
    const lifetime = await Test.create({ title: "Lifetime", mode: "test", durationMinutes: 30, questions: [qL._id], totalMarks: 1, status: "published", isPublished: true, targets: [], createdBy: admin._id });

    const submit = (id, sel) => request.post(`/api/tests/${id}/submit`).set(...auth(tok)).send({ answers: [{ questionId: String(sel.q), selectedIndex: sel.i }] });
    const getAttempt = (id) => request.get(`/api/attempts/${id}`).set(...auth(tok));
    const testsTaken = async () => (await User.findById(student._id).lean()).stats?.testsTaken || 0;

    // --- 1. Practice: repeatable, persisted, but NOT counted in graded stats ---
    const p1 = await submit(practice._id, { q: qP._id, i: 0 });
    const p2 = await submit(practice._id, { q: qP._id, i: 2 });
    assert.strictEqual(p1.status, 201, "practice submit persists (201)");
    assert.strictEqual(p2.status, 201, "practice stays repeatable (second 201)");
    assert.strictEqual(await testsTaken(), 0, "practice does NOT inflate Tests Taken");
    ok("practice attempts persist and stay repeatable without touching graded stats");

    // A practice attempt is fully reviewable immediately (answers shown).
    const pRev = await getAttempt(p2.body.attemptId);
    assert.strictEqual(pRev.body.attempt.reviewLocked, undefined, "practice review is never locked");
    assert.strictEqual(pRev.body.attempt.answers[0].correctIndex, 2, "practice review shows the answer key");
    ok("a practice attempt is fully reviewable right away");

    // --- 2. Open deadline test: answer key sealed until close ---
    const w = await submit(windowed._id, { q: qW._id, i: 0 });
    assert.strictEqual(w.status, 201, "windowed graded submit accepted");
    assert.strictEqual(await testsTaken(), 1, "a graded submit DOES count toward Tests Taken");
    const wRev = await getAttempt(w.body.attemptId);
    const wa = wRev.body.attempt;
    assert.strictEqual(wa.reviewLocked, true, "an open deadline test locks the review");
    assert.ok(wa.reviewUnlocksAt, "and tells the client when it unlocks");
    assert.strictEqual(wa.answers[0].correctIndex, undefined, "the correct index is stripped while open");
    assert.strictEqual(wa.answers[0].explanation, undefined, "the explanation is stripped while open");
    assert.strictEqual(wa.answers[0].correct, undefined, "per-question correctness is stripped while open");
    assert.strictEqual(wa.answers[0].selectedIndex, 0, "but the student still sees what they picked");
    assert.ok(typeof wa.score === "number", "and their own score");
    ok("an open deadline test seals the answer key (score visible, key hidden)");

    // --- 3. Lifetime graded test (no closeAt): reviewable immediately ---
    const l = await submit(lifetime._id, { q: qL._id, i: 2 });
    const lRev = await getAttempt(l.body.attemptId);
    assert.strictEqual(lRev.body.attempt.reviewLocked, undefined, "a lifetime graded test is never locked");
    assert.strictEqual(lRev.body.attempt.answers[0].correctIndex, 2, "so its answer key shows right after submit");
    ok("a lifetime graded test shows the full review immediately");

    console.log(`\n✅ All ${passed} result-lock checks passed`);
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
