// Tests for mentor profiles: PUBLIC read (no auth), ADMIN-only add/delete, and
// the founding-mentor seed. Photo upload (Cloudinary) isn't exercised here — we
// add mentors without a photo. Run: node tests/mentors.test.js
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
const { ensureMentorsSeeded } = require("../src/config/seedMentors");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // Seeding populates the three founding mentors when the collection is empty.
    await ensureMentorsSeeded();
    const seeded = (await request.get("/api/mentors")).body.mentors;
    assert.strictEqual(seeded.length, 3, "three founding mentors seeded");
    assert.ok(seeded.some((m) => m.name === "Parth Singh Shekhawat"), "Parth is seeded");
    ok("the founding mentors are seeded and publicly readable (no auth)");

    // Seeding again is a no-op (doesn't duplicate).
    await ensureMentorsSeeded();
    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 3, "no duplicate seeding");
    ok("re-seeding is a no-op");

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "admin", isVerified: true, authProvider: "local",
    });
    const teacher = await User.create({
        name: "Mentor", email: "m@t.com", password: "secret123", phone: "9000000002",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local",
    });
    const adminToken = generateToken(admin._id);
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);

    // Neither student nor mentor can add — admin only.
    const sForbid = await request.post("/api/mentors").set(...auth(studentToken)).send({ name: "X" });
    assert.strictEqual(sForbid.status, 403, "student cannot add");
    const tForbid = await request.post("/api/mentors").set(...auth(teacherToken)).send({ name: "X" });
    assert.strictEqual(tForbid.status, 403, "mentor cannot add");
    ok("only admins can add mentors (students and mentors get 403)");

    // Admin adds a mentor (with a description, no photo).
    const add = await request
        .post("/api/mentors")
        .set(...auth(adminToken))
        .send({ name: "Riya Sharma", exam: "DTU LEET 2024", description: "Cracked it in her first attempt." });
    assert.strictEqual(add.status, 201, "admin adds a mentor");
    assert.strictEqual(add.body.mentor.name, "Riya Sharma");
    assert.strictEqual(add.body.mentor.description, "Cracked it in her first attempt.");
    assert.strictEqual(add.body.mentor.photo, null, "no photo when none uploaded");
    const newId = add.body.mentor._id;
    ok("an admin adds a mentor with a description");

    // A nameless mentor is rejected.
    const noName = await request.post("/api/mentors").set(...auth(adminToken)).send({ exam: "x" });
    assert.strictEqual(noName.status, 400, "name is required");
    ok("a mentor without a name is rejected");

    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 4, "now four mentors");

    // Admin deletes the added mentor.
    const del = await request.delete(`/api/mentors/${newId}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin deletes a mentor");
    // A student can't delete.
    const delForbid = await request.delete(`/api/mentors/${seeded[0]._id}`).set(...auth(studentToken));
    assert.strictEqual(delForbid.status, 403, "student cannot delete");
    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 3, "back to three");
    ok("an admin can delete a mentor; students cannot");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} mentor checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ MENTORS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
