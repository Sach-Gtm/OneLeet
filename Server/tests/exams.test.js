// Tests for university/LEET-wise content targeting + filtering: staff target
// content at specific exams; students see only content for the exams they chose
// (plus untargeted "for everyone" content); choices are validated + editable.
// Run: node tests/exams.test.js
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
        name: "M", email: "m@t.com", password: "secret123", phone: "9000000001",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    const teacherToken = generateToken(teacher._id);

    // The catalog is served.
    const cat = await request.get("/api/exams").set(...auth(teacherToken));
    assert.strictEqual(cat.status, 200);
    assert.ok(cat.body.exams.length > 10, "catalog has many exams");
    assert.ok(cat.body.exams.some((e) => e.code === "ipu-leet"), "catalog includes IPU LEET");
    ok("the LEET exam catalog is served at /api/exams");

    // Staff create three syllabi with different targeting.
    const mk = (title, targets) =>
        request.post("/api/syllabus").set(...auth(teacherToken)).send({
            title,
            targets,
            chapters: [{ title: "C", topics: [{ title: "T", estimatedHours: 1 }] }],
        });
    const ipu = await mk("IPU only", ["ipu-leet"]);
    await mk("DTU only", ["dtu-nsut-leet"]);
    await mk("Everyone", []); // untargeted → for all
    assert.strictEqual(ipu.status, 201);
    assert.deepStrictEqual(ipu.body.syllabus.targets, ["ipu-leet"], "targets saved on the syllabus");
    ok("staff can target a syllabus at specific exams");

    // A student preparing for IPU sees IPU + untargeted, NOT DTU.
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    const sToken = generateToken(student._id);
    const titles = (await request.get("/api/syllabus").set(...auth(sToken))).body.syllabi.map((s) => s.title);
    assert.ok(titles.includes("IPU only"), "sees IPU content");
    assert.ok(titles.includes("Everyone"), "sees untargeted content");
    assert.ok(!titles.includes("DTU only"), "does NOT see DTU content");
    ok("a student sees only their exams' content (plus untargeted)");

    // A student with NO enrollments sees ONLY universal content — never every
    // exam's. This is the load-bearing invariant of the enrollment model: an
    // empty exam list must NOT collapse to "see everything".
    const fresh = await User.create({
        name: "F", email: "f@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local",
    });
    const fTitles = (await request.get("/api/syllabus").set(...auth(generateToken(fresh._id)))).body.syllabi.map((s) => s.title);
    assert.deepStrictEqual(fTitles, ["Everyone"], "no enrollment → only universal content");
    ok("a student with no enrollments sees ONLY universal content (not everything)");

    // Under the enrollment model `exams` is NOT a self-set profile field — it's
    // derived from course enrollments. The profile update must IGNORE any `exams`
    // in the body (other fields still save), so a student can't grant themselves
    // an exam by PATCHing their profile.
    const upd = await request
        .patch("/api/auth/me")
        .set(...auth(sToken))
        .send({ exams: ["dtu-nsut-leet", "all"], college: "New College" });
    assert.strictEqual(upd.status, 200);
    assert.deepStrictEqual(upd.body.user.exams, ["ipu-leet"], "exams in the body are ignored (enrollment-derived)");
    assert.strictEqual(upd.body.user.college, "New College", "other profile fields still update");
    ok("the profile can't self-set exams — access comes from enrollments");

    // The student's visible content still follows their (enrollment-derived) exams,
    // unchanged by the profile PATCH above.
    const t2 = (await request.get("/api/syllabus").set(...auth(sToken))).body.syllabi.map((s) => s.title);
    assert.ok(t2.includes("IPU only") && t2.includes("Everyone") && !t2.includes("DTU only"), "still scoped to IPU");
    ok("content scoping is driven by enrollments, not a profile picker");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} exam-targeting checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ EXAMS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
