// Verifies single-attempt mock tests + the list metadata the redesigned Tests
// page needs: a graded mock test can be taken once (then only its result is
// offered), practice stays repeatable, and each test carries its deadline
// (closeAt) + the caller's latest attempt.
// Run: node tests/testAttempts.test.js
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
    const studentT = generateToken(student._id);

    const mkQ = () => Question.create({ text: "Q", options: ["A", "B"], correctIndex: 0, createdBy: admin._id });
    const qMock = await mkQ();
    const qPrac = await mkQ();
    const qWin = await mkQ();

    const mock = await Test.create({ title: "Mock", mode: "test", durationMinutes: 30, questions: [qMock._id], totalMarks: 1, status: "published", isPublished: true, targets: [], createdBy: admin._id });
    const practice = await Test.create({ title: "Practice", mode: "practice", durationMinutes: 10, questions: [qPrac._id], totalMarks: 1, status: "published", isPublished: true, targets: [], createdBy: admin._id });
    const future = new Date(Date.now() + 7 * 864e5);
    const windowed = await Test.create({ title: "Windowed", mode: "test", durationMinutes: 30, questions: [qWin._id], totalMarks: 1, status: "published", isPublished: true, targets: [], closeAt: future, createdBy: admin._id });

    // Deadline metadata: closeAt passes through; absence means lifetime.
    let list = (await request.get("/api/tests").set(...auth(studentT))).body.tests;
    const mrow = () => list.find((t) => String(t._id) === String(mock._id));
    const wrow = list.find((t) => String(t._id) === String(windowed._id));
    assert.strictEqual(mrow().closeAt, null, "mock without a window → no deadline (lifetime)");
    assert.ok(wrow.closeAt, "windowed test carries its closeAt deadline");
    assert.strictEqual(mrow().attempted, false, "not attempted yet");
    assert.strictEqual(mrow().attemptId, null, "no attempt id yet");
    ok("list exposes each test's deadline (closeAt) and the caller's attempt state");

    // First open + submit of the mock test works.
    assert.strictEqual((await request.get(`/api/tests/${mock._id}`).set(...auth(studentT))).status, 200, "mock opens the first time");
    const submit1 = await request.post(`/api/tests/${mock._id}/submit`).set(...auth(studentT)).send({ answers: [{ questionId: String(qMock._id), selectedIndex: 0 }] });
    assert.strictEqual(submit1.status, 201, "first submit accepted");
    const attemptId = submit1.body.attemptId;
    ok("a mock test can be taken the first time");

    // Second open is blocked and points at the result; second submit is rejected.
    const reopen = await request.get(`/api/tests/${mock._id}`).set(...auth(studentT));
    assert.strictEqual(reopen.status, 403, "re-opening a taken mock test is blocked");
    assert.strictEqual(reopen.body.code, "ALREADY_ATTEMPTED", "with the ALREADY_ATTEMPTED code");
    assert.strictEqual(String(reopen.body.attemptId), String(attemptId), "and the existing attempt id");
    const submit2 = await request.post(`/api/tests/${mock._id}/submit`).set(...auth(studentT)).send({ answers: [] });
    assert.strictEqual(submit2.status, 409, "a second submit is rejected");
    ok("a mock test is single-attempt: re-open 403s to the result, re-submit 409s");

    // The list now reflects the attempt so the card can show "See result".
    list = (await request.get("/api/tests").set(...auth(studentT))).body.tests;
    assert.strictEqual(mrow().attempted, true, "list marks it attempted");
    assert.strictEqual(String(mrow().attemptId), String(attemptId), "list carries the attempt id for the result link");
    ok("after taking it, the list marks the mock test done with its result link");

    // Practice stays repeatable.
    const p1 = await request.post(`/api/tests/${practice._id}/submit`).set(...auth(studentT)).send({ answers: [{ questionId: String(qPrac._id), selectedIndex: 0 }] });
    assert.strictEqual(p1.status, 201, "practice first submit ok");
    assert.strictEqual((await request.get(`/api/tests/${practice._id}`).set(...auth(studentT))).status, 200, "practice re-opens freely");
    const p2 = await request.post(`/api/tests/${practice._id}/submit`).set(...auth(studentT)).send({ answers: [{ questionId: String(qPrac._id), selectedIndex: 1 }] });
    assert.strictEqual(p2.status, 201, "practice second submit also ok");
    ok("practice sets stay repeatable (multiple attempts allowed)");

    // A taken practice set is flagged attempted (so the card shows Retake / View
    // Result, not "Start Practice") and carries an attempt id for the result link.
    list = (await request.get("/api/tests").set(...auth(studentT))).body.tests;
    const prow = list.find((t) => String(t._id) === String(practice._id));
    assert.strictEqual(prow.attempted, true, "practice set marked attempted after submitting");
    assert.ok(prow.attemptId, "practice set carries an attempt id for View Result");
    ok("an attempted practice set surfaces as attempted (Retake / View Result)");

    // Resilience: even if the practice test is re-seeded with a NEW _id, the
    // earlier attempt (matched on its snapshotted testTitle) still marks it done.
    const reseeded = await Test.create({ title: "Practice", mode: "practice", durationMinutes: 10, questions: [qPrac._id], totalMarks: 1, status: "published", isPublished: true, targets: [], createdBy: admin._id });
    list = (await request.get("/api/tests").set(...auth(studentT))).body.tests;
    const rrow = list.find((t) => String(t._id) === String(reseeded._id));
    assert.strictEqual(rrow.attempted, true, "re-seeded practice (new _id, same title) stays attempted");
    ok("a re-seeded practice test keeps its attempted state via title match");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} test-attempt checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST ATTEMPTS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
