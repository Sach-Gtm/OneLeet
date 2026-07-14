// Integration tests for the admin panel and the role/permission model:
// phone-or-email login, the four-tier hierarchy (student / teacher-mentor /
// admin / superadmin), who can see student data, who can change roles, who can
// remove accounts, and the super-admin-only premium toggle.
// Run: node tests/admin.test.js
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
const bootstrapSuperadmin = require("../src/config/bootstrapSuperadmin");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];
const idOf = async (email) => (await User.findOne({ email }).select("_id"))._id.toString();
const login = async (identifier, password) => {
    const r = await request.post("/api/auth/login").send({ identifier, password });
    return r.body.token;
};

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // Admin created out-of-band (as the create:admin script does).
    await User.create({
        name: "Boss", email: "boss@oneleet.local", phone: "9990001111",
        password: "adminpass", role: "admin", isVerified: true, authProvider: "local",
    });
    // Self-registration must NOT grant the Super Admin role even for the known
    // super-admin address — otherwise anyone could claim it. Registering it
    // yields a plain student...
    await request.post("/api/auth/register").send({
        name: "Sachin", email: "sachin.gautam8292@gmail.com",
        password: "superpass", phone: "9111122223",
    });
    assert.strictEqual(
        (await User.findOne({ email: "sachin.gautam8292@gmail.com" })).role,
        "student"
    );
    ok("registering the super-admin email does NOT grant the role");
    // ...it is provisioned out-of-band by the startup bootstrap.
    await bootstrapSuperadmin();
    assert.strictEqual(
        (await User.findOne({ email: "sachin.gautam8292@gmail.com" })).role,
        "superadmin"
    );
    ok("bootstrap promotes the super-admin email out-of-band");

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

    // A student registers — and even if they try to self-select "teacher",
    // registration forces them to student (mentors are granted by an admin).
    const reg = await request.post("/api/auth/register").send({
        name: "Pupil", email: "pupil@test.com", password: "secret123",
        phone: "8887776665", role: "teacher",
    });
    assert.strictEqual(reg.status, 201);
    const studentToken = reg.body.token;
    assert.ok(studentToken);
    assert.strictEqual((await User.findOne({ email: "pupil@test.com" })).role, "student");
    ok("student registers (self-selected 'teacher' is ignored → student)");

    // Admin sees overview (only pupil so far)
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
    const forbidden = await request.get("/api/admin/students").set(...auth(studentToken));
    assert.strictEqual(forbidden.status, 403);
    ok("student is blocked from admin API (403)");

    // Super Admin logs in
    const superToken = await login("sachin.gautam8292@gmail.com", "superpass");
    assert.ok(superToken);
    ok("super-admin logs in");

    // Two more students for the role/premium/removal checks.
    await request.post("/api/auth/register").send({
        name: "Pupil Two", email: "pupil2@test.com", password: "secret123", phone: "8887770002",
    });
    await request.post("/api/auth/register").send({
        name: "Pupil Three", email: "pupil3@test.com", password: "secret123", phone: "8887770003",
    });

    // Admin CAN turn a student into a mentor (teacher).
    const promote = await request.patch("/api/admin/users/role")
        .set(...auth(adminToken)).send({ email: "pupil@test.com", role: "teacher" });
    assert.strictEqual(promote.status, 200);
    assert.strictEqual(promote.body.user.role, "teacher");
    ok("admin promotes a student to mentor");

    // That mentor must NOT see student data.
    const mentorBlocked = await request.get("/api/admin/students").set(...auth(studentToken));
    assert.strictEqual(mentorBlocked.status, 403);
    ok("mentor is blocked from student data (403)");

    // Admin may NOT grant admin.
    const grantAdmin = await request.patch("/api/admin/users/role")
        .set(...auth(adminToken)).send({ email: "pupil2@test.com", role: "admin" });
    assert.strictEqual(grantAdmin.status, 403);
    ok("admin cannot grant admin access (403)");

    // Admin may NOT touch a mentor/admin account.
    const touchMentor = await request.patch("/api/admin/users/role")
        .set(...auth(adminToken)).send({ email: "pupil@test.com", role: "student" });
    assert.strictEqual(touchMentor.status, 403);
    ok("admin cannot re-role a mentor (403)");

    // Super Admin CAN grant admin.
    const superGrant = await request.patch("/api/admin/users/role")
        .set(...auth(superToken)).send({ email: "pupil3@test.com", role: "admin" });
    assert.strictEqual(superGrant.status, 200);
    ok("super-admin grants admin access");

    // Staff roster ("who is admin and mentor").
    const staff = await request.get("/api/admin/staff").set(...auth(adminToken));
    assert.strictEqual(staff.status, 200);
    const emails = staff.body.staff.map((s) => s.email);
    assert.ok(emails.includes("sachin.gautam8292@gmail.com"));
    assert.ok(emails.includes("boss@oneleet.local"));
    assert.ok(emails.includes("pupil@test.com")); // the mentor
    assert.ok(emails.includes("pupil3@test.com")); // the new admin
    ok("staff roster lists mentors + admins + super-admin");

    // Premium is super-admin only.
    const s2 = await idOf("pupil2@test.com");
    const adminPremium = await request.patch(`/api/admin/students/${s2}/plan`)
        .set(...auth(adminToken)).send({ plan: "pro" });
    assert.strictEqual(adminPremium.status, 403);
    ok("admin cannot toggle premium (403)");

    const superPremium = await request.patch(`/api/admin/students/${s2}/plan`)
        .set(...auth(superToken)).send({ plan: "pro" });
    assert.strictEqual(superPremium.status, 200);
    assert.strictEqual(superPremium.body.student.plan, "pro");
    ok("super-admin moves a student to premium");

    // Removal rules.
    const mentorId = await idOf("pupil@test.com");
    const adminRemoveMentor = await request.delete(`/api/admin/users/${mentorId}`)
        .set(...auth(adminToken));
    assert.strictEqual(adminRemoveMentor.status, 403);
    ok("admin cannot remove a mentor (403)");

    const superRemoveMentor = await request.delete(`/api/admin/users/${mentorId}`)
        .set(...auth(superToken));
    assert.strictEqual(superRemoveMentor.status, 200);
    assert.strictEqual(await User.findById(mentorId), null);
    ok("super-admin removes a mentor");

    const adminRemoveStudent = await request.delete(`/api/admin/users/${s2}`)
        .set(...auth(adminToken));
    assert.strictEqual(adminRemoveStudent.status, 200);
    assert.strictEqual(await User.findById(s2), null);
    ok("admin removes a student");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} admin checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ADMIN TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
