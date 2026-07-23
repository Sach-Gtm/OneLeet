// Tests for Syllabus Tracking: staff author a syllabus (manual + AI-draft),
// students track topic completion and see their percentage, and only staff can
// create/edit. Uses the offline "stub" AI provider. Run: node tests/syllabus.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.AI_PROVIDER; // -> stub
delete process.env.GEMINI_API_KEY;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const teacher = await User.create({
        name: "Mentor", email: "m@test.com", password: "secret123", phone: "9000000001",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "Learner", email: "s@test.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local",
    });
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);

    // AI authoring is staff-only: a student can't AI-draft (or scan).
    const stuAi = await request.post("/api/syllabus/ai-draft").set(...auth(studentToken)).send({ text: "Algebra: Matrices" });
    assert.strictEqual(stuAi.status, 403, "student cannot use the syllabus AI");
    ok("students can't use the syllabus AI (staff only)");

    // But a student CAN build their own PERSONAL syllabus by hand.
    const personal = await request
        .post("/api/syllabus")
        .set(...auth(studentToken))
        .send({ title: "My plan", chapters: [{ title: "Week 1", topics: [{ title: "Revise Algebra", estimatedHours: 2 }] }] });
    assert.strictEqual(personal.status, 201, "student can create a personal syllabus");
    assert.strictEqual(personal.body.syllabus.scope, "personal", "the student's syllabus is personal");
    const personalId = personal.body.syllabus._id;
    ok("students can build their own personal syllabus by hand");

    // Staff can AI-draft from pasted text (stub returns structured chapters).
    const draft = await request
        .post("/api/syllabus/ai-draft")
        .set(...auth(teacherToken))
        .send({ text: "Thermodynamics: Laws, Entropy, Carnot Cycle. Fluid Mechanics: Bernoulli.", subject: "Mechanical" });
    assert.strictEqual(draft.status, 200, "mentor can AI-draft");
    assert.ok(Array.isArray(draft.body.draft.chapters) && draft.body.draft.chapters.length > 0, "draft has chapters");
    ok("a mentor can AI-draft a syllabus from text");

    // Staff create a syllabus (1 chapter, 2 topics with hours).
    const created = await request
        .post("/api/syllabus")
        .set(...auth(teacherToken))
        .send({
            title: "Mathematics",
            subject: "Mathematics",
            chapters: [
                { title: "Algebra", topics: [
                    { title: "Matrices", estimatedHours: 4 },
                    { title: "Determinants", estimatedHours: 2 },
                ] },
            ],
        });
    assert.strictEqual(created.status, 201, "mentor can create a syllabus");
    const syllabus = created.body.syllabus;
    const topicA = syllabus.chapters[0].topics[0];
    const topicB = syllabus.chapters[0].topics[1];
    assert.ok(topicA._id && topicA.estimatedHours === 4, "topics carry _id + hours");
    ok("a mentor can create a syllabus with chapters, topics and hours");

    // Student lists syllabi and sees 0% to start.
    const list0 = await request.get("/api/syllabus").set(...auth(studentToken));
    assert.strictEqual(list0.status, 200);
    const s0 = list0.body.syllabi.find((s) => String(s._id) === String(syllabus._id));
    assert.strictEqual(s0.progress.percent, 0, "starts at 0%");
    assert.strictEqual(s0.progress.totalTopics, 2, "counts 2 topics");
    assert.strictEqual(s0.progress.totalHours, 6, "sums 6 hours");
    ok("a student sees the syllabus at 0% with correct totals");

    // Student marks one topic complete → 50%.
    const t1 = await request
        .post(`/api/syllabus/${syllabus._id}/toggle`)
        .set(...auth(studentToken))
        .send({ topicId: topicA._id, done: true });
    assert.strictEqual(t1.status, 200);
    assert.strictEqual(t1.body.progress.percent, 50, "one of two topics = 50%");
    assert.strictEqual(t1.body.progress.doneHours, 4, "completed hours tracked");
    ok("marking a topic complete moves progress to 50%");

    // Completing the second → 100%.
    const t2 = await request
        .post(`/api/syllabus/${syllabus._id}/toggle`)
        .set(...auth(studentToken))
        .send({ topicId: topicB._id, done: true });
    assert.strictEqual(t2.body.progress.percent, 100, "both topics = 100%");
    ok("completing all topics reaches 100%");

    // Un-checking one → back to 50%.
    const t3 = await request
        .post(`/api/syllabus/${syllabus._id}/toggle`)
        .set(...auth(studentToken))
        .send({ topicId: topicB._id, done: false });
    assert.strictEqual(t3.body.progress.percent, 50, "un-marking drops back to 50%");
    ok("un-marking a topic decreases progress");

    // Dashboard summary reflects the student's overall coverage.
    // Overall coverage spans the global syllabus (1 of 2 done) AND the student's
    // own personal syllabus (0 of 1 done) → 1 of 3 topics = 33%.
    const summary = await request.get("/api/syllabus/me/summary").set(...auth(studentToken));
    assert.strictEqual(summary.status, 200);
    assert.strictEqual(summary.body.summary.totalTopics, 3, "counts global + personal topics");
    assert.strictEqual(summary.body.summary.doneTopics, 1, "one topic done overall");
    assert.strictEqual(summary.body.summary.percent, 33, "overall coverage is 33%");
    ok("the dashboard summary reflects overall coverage (global + personal)");

    // A different student is unaffected by the first's progress.
    const other = await User.create({
        name: "Other", email: "o@test.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local",
    });
    const otherList = await request.get("/api/syllabus").set(...auth(generateToken(other._id)));
    const os = otherList.body.syllabi.find((s) => String(s._id) === String(syllabus._id));
    assert.strictEqual(os.progress.percent, 0, "another student starts fresh");
    ok("progress is per-student (isolated)");

    // A student's PERSONAL syllabus is private — no one else sees it.
    assert.ok(
        !otherList.body.syllabi.some((s) => String(s._id) === String(personalId)),
        "another student can't see a personal syllabus"
    );
    // ...and a non-owner can't toggle topics on it.
    const sneak = await request
        .post(`/api/syllabus/${personalId}/toggle`)
        .set(...auth(generateToken(other._id)))
        .send({ topicId: personal.body.syllabus.chapters[0].topics[0]._id, done: true });
    assert.strictEqual(sneak.status, 404, "non-owner can't touch a personal syllabus");
    ok("a personal syllabus is private to its owner");

    // Toggling a topic that isn't in the syllabus is rejected.
    const bad = await request
        .post(`/api/syllabus/${syllabus._id}/toggle`)
        .set(...auth(studentToken))
        .send({ topicId: new mongoose.Types.ObjectId().toString(), done: true });
    assert.strictEqual(bad.status, 400, "unknown topic is rejected");
    ok("toggling a topic not in the syllabus is refused");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} syllabus checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ SYLLABUS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
