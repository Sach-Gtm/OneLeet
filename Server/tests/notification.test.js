// Integration tests for notifications (staff broadcast → user bell) and team
// role management. Run: node tests/notification.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
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

    await User.create({
        name: "Admin",
        email: "admin@oneleet.local",
        phone: "9990001111",
        password: "adminpass",
        role: "admin",
        isVerified: true,
        authProvider: "local",
    });
    const adminToken = (
        await request
            .post("/api/auth/login")
            .send({ identifier: "9990001111", password: "adminpass" })
    ).body.token;

    const studentToken = (
        await request.post("/api/auth/register").send({
            name: "Kid",
            email: "kid@test.com",
            password: "secret123",
            phone: "8887776665",
        })
    ).body.token;

    // Student can't broadcast
    const forbidden = await request
        .post("/api/notifications")
        .set(...auth(studentToken))
        .send({ title: "Hi", body: "Nope" });
    assert.strictEqual(forbidden.status, 403);
    ok("students can't send notifications (403)");

    // Admin broadcasts
    const sent = await request
        .post("/api/notifications")
        .set(...auth(adminToken))
        .send({ title: "New mock test!", body: "Attempt it today." });
    assert.strictEqual(sent.status, 201);
    ok("admin sends a notification");

    // Student sees it as unread
    let feed = await request.get("/api/notifications").set(...auth(studentToken));
    assert.strictEqual(feed.status, 200);
    assert.strictEqual(feed.body.notifications.length, 1);
    assert.strictEqual(feed.body.unreadCount, 1);
    assert.strictEqual(feed.body.notifications[0].title, "New mock test!");
    ok("student sees the notification as unread");

    // Mark all read → unread clears
    await request.post("/api/notifications/read-all").set(...auth(studentToken));
    feed = await request.get("/api/notifications").set(...auth(studentToken));
    assert.strictEqual(feed.body.unreadCount, 0);
    ok("mark-all-read clears the unread count");

    // Admin promotes the student to teacher
    const promote = await request
        .patch("/api/admin/users/role")
        .set(...auth(adminToken))
        .send({ email: "kid@test.com", role: "teacher" });
    assert.strictEqual(promote.status, 200);
    assert.strictEqual(promote.body.user.role, "teacher");
    ok("admin promotes a teammate to teacher by email");

    // Admin can't change own role
    const self = await request
        .patch("/api/admin/users/role")
        .set(...auth(adminToken))
        .send({ email: "admin@oneleet.local", role: "student" });
    assert.strictEqual(self.status, 400);
    ok("admin can't change their own role (400)");

    // The now-teacher still can't change roles (admin-only)
    const teacherToken = (
        await request
            .post("/api/auth/login")
            .send({ identifier: "kid@test.com", password: "secret123" })
    ).body.token;
    const teacherTry = await request
        .patch("/api/admin/users/role")
        .set(...auth(teacherToken))
        .send({ email: "admin@oneleet.local", role: "student" });
    assert.strictEqual(teacherTry.status, 403);
    ok("teachers can't change roles (admin-only, 403)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} notification/role checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
