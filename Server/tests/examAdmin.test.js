// Tests for admin-managed college/LEET catalog: an admin adds/removes colleges
// and it takes effect GLOBALLY (the /api/exams catalog + validation update);
// only admins can manage it. Run: node tests/examAdmin.test.js
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
const { ensureExamsSeeded } = require("../src/config/exams");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await ensureExamsSeeded(); // seed the DB catalog + load the cache (as the server does)

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "admin", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local",
    });
    const adminToken = generateToken(admin._id);
    const studentToken = generateToken(student._id);

    const seededCount = (await request.get("/api/exams").set(...auth(studentToken))).body.exams.length;
    assert.ok(seededCount >= 30, "catalog seeded from the list");
    ok("the catalog is seeded into the database");

    // A student can't manage the catalog.
    const forbid = await request.post("/api/admin/exams").set(...auth(studentToken)).send({ name: "X" });
    assert.strictEqual(forbid.status, 403, "student cannot add a college");
    ok("students can't manage the catalog (admin only)");

    // Admin adds a college — takes effect globally in /api/exams.
    const add = await request
        .post("/api/admin/exams")
        .set(...auth(adminToken))
        .send({ name: "Bennett University", group: "Private / Deemed" });
    assert.strictEqual(add.status, 201, "admin can add a college");
    assert.strictEqual(add.body.exam.code, "bennett-university", "code slugified from the name");
    const newId = add.body.exam._id;

    const afterAdd = (await request.get("/api/exams").set(...auth(studentToken))).body.exams;
    assert.strictEqual(afterAdd.length, seededCount + 1, "catalog grew by one, globally");
    assert.ok(afterAdd.some((e) => e.code === "bennett-university"), "new college is in the live catalog");
    ok("an admin adds a college and it appears globally");

    // The new code is now valid for targeting content.
    const syl = await request
        .post("/api/syllabus")
        .set(...auth(generateToken((await User.create({
            name: "T", email: "t@t.com", password: "secret123", phone: "9000000003",
            role: "teacher", isVerified: true, authProvider: "local",
        }))._id)))
        .send({ title: "New-college syllabus", targets: ["bennett-university"], chapters: [{ title: "C", topics: [{ title: "T", estimatedHours: 1 }] }] });
    assert.strictEqual(syl.status, 201);
    assert.deepStrictEqual(syl.body.syllabus.targets, ["bennett-university"], "content can target the new college");
    ok("newly added colleges are immediately valid targets");

    // Admin removes it — catalog shrinks back, globally.
    const del = await request.delete(`/api/admin/exams/${newId}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin can remove a college");
    const afterDel = (await request.get("/api/exams").set(...auth(studentToken))).body.exams;
    assert.strictEqual(afterDel.length, seededCount, "catalog back to the seeded size");
    assert.ok(!afterDel.some((e) => e.code === "bennett-university"), "removed college is gone");
    ok("an admin removes a college and it disappears globally");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} admin-catalog checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ EXAM-ADMIN TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
