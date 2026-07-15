// Integration tests for the Content Studio: AI draft → save draft → edit →
// publish, plus gating (students blocked) and draft invisibility to students.
// Run: node tests/studio.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.BREVO_API_KEY;
// No GEMINI key → the offline stub provider serves draftAssessment.

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    await User.create({
        name: "Mentor", email: "mentor@test.com", phone: "9000000001",
        password: "mentorpass", role: "teacher", isVerified: true, authProvider: "local",
    });
    const mentor = (
        await request.post("/api/auth/login").send({ identifier: "mentor@test.com", password: "mentorpass" })
    ).body.token;
    const student = (
        await request.post("/api/auth/register").send({
            name: "Kid", email: "kid@test.com", password: "secret123", phone: "9000000002",
        })
    ).body.token;

    // Students are blocked from the Studio.
    const blocked = await request.post("/api/studio/ai-draft").set(...auth(student)).send({ topic: "Algebra" });
    assert.strictEqual(blocked.status, 403);
    ok("students are blocked from the Studio (403)");

    // AI draft from pasted text (stub provider) — nothing saved yet.
    const drafted = await request
        .post("/api/studio/ai-draft")
        .set(...auth(mentor))
        .send({ text: "Ohm's law: V = I R. Power P = VI.", mode: "practice", count: 3, subject: "Physics" });
    assert.strictEqual(drafted.status, 200);
    assert.ok(Array.isArray(drafted.body.draft.questions) && drafted.body.draft.questions.length === 3);
    ok("AI drafts an editable set from pasted text (not saved)");

    // Save it as a DRAFT.
    const created = await request
        .post("/api/studio/tests")
        .set(...auth(mentor))
        .send({
            title: "Physics practice",
            subject: "Physics",
            mode: "practice",
            questions: drafted.body.draft.questions.map((q) => ({
                text: q.text, options: q.options, correctIndex: q.correctIndex, marks: 1,
            })),
        });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.test.status, "draft");
    assert.strictEqual(created.body.test.isPublished, false);
    assert.strictEqual(created.body.test.totalMarks, 3);
    const testId = created.body.test._id;
    ok("mentor saves a draft (status=draft, hidden from students)");

    // A draft must NOT appear in the student-facing test list.
    let studentList = await request.get("/api/tests").set(...auth(student));
    assert.strictEqual(studentList.status, 200);
    const beforeIds = (studentList.body.tests || studentList.body || []).map((t) => t._id);
    assert.ok(!beforeIds.includes(testId), "draft must be hidden from students");
    ok("draft is invisible to students");

    // Edit the draft (rename + tweak a question).
    const edited = await request
        .patch(`/api/studio/tests/${testId}`)
        .set(...auth(mentor))
        .send({ title: "Physics practice (Ohm's law)", durationMinutes: 15 });
    assert.strictEqual(edited.status, 200);
    assert.strictEqual(edited.body.test.title, "Physics practice (Ohm's law)");
    ok("mentor edits the draft");

    // Publish it.
    const published = await request.post(`/api/studio/tests/${testId}/publish`).set(...auth(mentor));
    assert.strictEqual(published.status, 200);
    assert.strictEqual(published.body.test.status, "published");
    assert.strictEqual(published.body.test.isPublished, true);
    ok("mentor publishes the draft");

    // Now it appears for students.
    studentList = await request.get("/api/tests").set(...auth(student));
    const afterIds = (studentList.body.tests || studentList.body || []).map((t) => t._id);
    assert.ok(afterIds.includes(testId), "published test must be visible to students");
    ok("published test is visible to students");

    // Bad id → 404 (not 500).
    const bad = await request.get("/api/studio/tests/not-an-id").set(...auth(mentor));
    assert.strictEqual(bad.status, 404);
    ok("malformed id returns 404");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} studio checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ STUDIO TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
