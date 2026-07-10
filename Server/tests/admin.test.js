// Integration tests for the admin panel: phone-or-email login, admin-only
// access to the staff API, and the premium toggle. Run: node tests/admin.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
// No email configured → OTP off → student registers verified with a token.
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.BREVO_API_KEY;

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

    // Admin created out-of-band (as the create:admin script does).
    await User.create({
        name: "Boss",
        email: "boss@oneleet.local",
        phone: "9990001111",
        password: "adminpass",
        role: "admin",
        isVerified: true,
        authProvider: "local",
    });

    // Login by PHONE
    const byPhone = await request
        .post("/api/auth/login")
        .send({ identifier: "9990001111", password: "adminpass" });
    assert.strictEqual(byPhone.status, 200, "admin login by phone should 200");
    const adminToken = byPhone.body.token;
    assert.ok(adminToken);
    assert.strictEqual(byPhone.body.user.role, "admin");
    ok("admin logs in with phone + password");

    // Login by EMAIL still works
    const byEmail = await request
        .post("/api/auth/login")
        .send({ identifier: "boss@oneleet.local", password: "adminpass" });
    assert.strictEqual(byEmail.status, 200);
    ok("login by email still works");

    // Wrong password rejected
    const bad = await request
        .post("/api/auth/login")
        .send({ identifier: "9990001111", password: "nope" });
    assert.strictEqual(bad.status, 401);
    ok("wrong password rejected (401)");

    // A student registers
    const reg = await request.post("/api/auth/register").send({
        name: "Pupil",
        email: "pupil@test.com",
        password: "secret123",
        phone: "8887776665",
    });
    assert.strictEqual(reg.status, 201);
    const studentToken = reg.body.token;
    assert.ok(studentToken);
    ok("student registers");

    // Admin sees overview
    const ov = await request.get("/api/admin/overview").set(...auth(adminToken));
    assert.strictEqual(ov.status, 200);
    assert.strictEqual(ov.body.overview.totalStudents, 1);
    ok("admin sees overview (1 student)");

    // Admin lists students, finds the student
    const list = await request.get("/api/admin/students").set(...auth(adminToken));
    assert.strictEqual(list.status, 200);
    assert.ok(list.body.students.some((s) => s.email === "pupil@test.com"));
    ok("admin lists students");

    // Search works
    const search = await request
        .get("/api/admin/students?search=8887776665")
        .set(...auth(adminToken));
    assert.strictEqual(search.body.students.length, 1);
    ok("admin can search students by phone");

    // Student is FORBIDDEN from the admin API
    const forbidden = await request
        .get("/api/admin/students")
        .set(...auth(studentToken));
    assert.strictEqual(forbidden.status, 403);
    ok("student is blocked from admin API (403)");

    // Admin toggles premium
    const studentId = list.body.students.find((s) => s.email === "pupil@test.com")._id;
    const plan = await request
        .patch(`/api/admin/students/${studentId}/plan`)
        .set(...auth(adminToken))
        .send({ plan: "pro" });
    assert.strictEqual(plan.status, 200);
    assert.strictEqual(plan.body.student.plan, "pro");
    ok("admin moves a student to premium");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} admin checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ADMIN TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
