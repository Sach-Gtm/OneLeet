// Integration tests for activity/time tracking + AI-search analytics:
// the heartbeat (signed-in and anonymous), a student's own time summary,
// "most searched topics (24h)", and the admin's per-student activity view.
// Run: node tests/activity.test.js
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
const AiQuery = require("../src/models/aiQueryModel");

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
        name: "Boss", email: "boss@oneleet.local", phone: "9990001111",
        password: "adminpass", role: "admin", isVerified: true, authProvider: "local",
    });
    const adminToken = (
        await request.post("/api/auth/login").send({ identifier: "9990001111", password: "adminpass" })
    ).body.token;
    const studentToken = (
        await request.post("/api/auth/register").send({
            name: "Pupil", email: "pupil@test.com", password: "secret123", phone: "8887776665",
        })
    ).body.token;
    const studentId = (await User.findOne({ email: "pupil@test.com" }).select("_id"))._id.toString();

    // Signed-in heartbeat records against the user.
    let hb = await request
        .post("/api/activity/heartbeat")
        .set(...auth(studentToken))
        .send({ path: "/dashboard", seconds: 120 });
    assert.strictEqual(hb.status, 200);
    ok("signed-in heartbeat accepted (200)");

    // Anonymous heartbeat (no token) — landing-page visits count too.
    hb = await request.post("/api/activity/heartbeat").send({ path: "/", seconds: 60, anonId: "anon-1" });
    assert.strictEqual(hb.status, 200);
    ok("anonymous heartbeat accepted (200)");

    // A garbage/zero heartbeat is a harmless no-op, never an error.
    hb = await request.post("/api/activity/heartbeat").send({ seconds: 0 });
    assert.strictEqual(hb.status, 200);
    ok("empty heartbeat is a safe no-op (200)");

    // The student's own time summary reflects their 120s.
    const me = await request.get("/api/activity/me").set(...auth(studentToken));
    assert.strictEqual(me.status, 200);
    assert.strictEqual(me.body.totalMinutes, 2);
    assert.ok(me.body.topPages.some((p) => p.path === "/dashboard"));
    ok("student time summary counts the minutes (2)");

    // Seed some AI searches (what generateQuestions logs), then check trending.
    await AiQuery.create([
        { user: studentId, tool: "questions", subject: "Maths", topic: "Calculus" },
        { user: studentId, tool: "questions", subject: "Maths", topic: "Calculus" },
        { user: studentId, tool: "questions", subject: "Physics", topic: "Optics" },
    ]);
    const trending = await request.get("/api/ai/trending").set(...auth(studentToken));
    assert.strictEqual(trending.status, 200);
    assert.strictEqual(trending.body.topics[0].topic, "Calculus");
    assert.strictEqual(trending.body.topics[0].count, 2);
    ok("trending shows the most-searched topic (24h)");

    // Admin per-student view: profile + time + AI topics.
    const act = await request.get(`/api/admin/students/${studentId}/activity`).set(...auth(adminToken));
    assert.strictEqual(act.status, 200);
    assert.strictEqual(act.body.student.email, "pupil@test.com");
    assert.strictEqual(act.body.time.totalMinutes, 2);
    assert.ok(act.body.ai.topTopics.some((t) => t.topic === "Calculus"));
    ok("admin sees a student's time + AI topics");

    // A student cannot view another student's activity.
    const denied = await request.get(`/api/admin/students/${studentId}/activity`).set(...auth(studentToken));
    assert.strictEqual(denied.status, 403);
    ok("student is blocked from the per-student view (403)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} activity/analytics checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ACTIVITY TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
