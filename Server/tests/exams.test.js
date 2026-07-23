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
    await mk("DTU only", ["dtu-leet"]);
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

    // A student who hasn't chosen sees everything.
    const fresh = await User.create({
        name: "F", email: "f@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local",
    });
    const fCount = (await request.get("/api/syllabus").set(...auth(generateToken(fresh._id)))).body.syllabi.length;
    assert.strictEqual(fCount, 3, "no preference → sees all");
    ok("a student with no chosen exams sees everything");

    // Choosing exams via the profile is validated against the catalog.
    const upd = await request
        .patch("/api/auth/me")
        .set(...auth(sToken))
        .send({ exams: ["dtu-leet", "totally-fake", "dtu-leet"] });
    assert.strictEqual(upd.status, 200);
    assert.deepStrictEqual(upd.body.user.exams, ["dtu-leet"], "bogus dropped + de-duped");
    ok("a student's chosen exams are validated and de-duped on save");

    // After switching to DTU, they now see DTU + untargeted, not IPU.
    const t2 = (await request.get("/api/syllabus").set(...auth(sToken))).body.syllabi.map((s) => s.title);
    assert.ok(t2.includes("DTU only") && t2.includes("Everyone") && !t2.includes("IPU only"), "filter follows the choice");
    ok("changing the choice changes what the student sees — editable any time");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} exam-targeting checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ EXAMS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
