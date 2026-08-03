// Integration tests for premium content-protection reporting:
//   • a student's detected capture attempts are logged + de-duped per day,
//   • admins are notified once per student/type/day (not per attempt),
//   • admins can list the alerts (rolled up per student),
//   • students can't read the alerts, and reporting needs auth.
// Run: node tests/security.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const SecurityEvent = require("../src/models/securityEventModel");
const Notification = require("../src/models/notificationModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

// notifyAdmins is fire-and-forget, so poll briefly for its effect.
async function waitUntil(fn, ms = 1500) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (await fn()) return true;
        await new Promise((r) => setTimeout(r, 20));
    }
    return false;
}

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({
        name: "Boss", email: "boss@oneleet.local", role: "admin", isVerified: true,
    });
    const student = await User.create({
        name: "Riya", email: "riya@test.com", phone: "9876500000", role: "student", isVerified: true,
    });
    const studentToken = generateToken(student._id);
    const adminToken = generateToken(admin._id);

    // ---- Unauthenticated report is rejected -------------------------------
    const anon = await request.post("/api/security/report").send({ type: "screenshot" });
    assert.strictEqual(anon.status, 401);
    ok("reporting requires authentication (401)");

    // ---- A screenshot attempt is logged -----------------------------------
    const r1 = await request
        .post("/api/security/report")
        .set(...auth(studentToken))
        .send({ type: "screenshot", contentType: "note", contentRef: "Thermodynamics" });
    assert.strictEqual(r1.status, 200);
    const ev = await SecurityEvent.findOne({ user: student._id, type: "screenshot" });
    assert.ok(ev, "a security event row was created");
    assert.strictEqual(ev.count, 1);
    assert.strictEqual(ev.email, "riya@test.com", "identity is snapshotted for the admin view");
    ok("a screenshot attempt is recorded (count 1, identity snapshot)");

    // Admin is notified for the first hit of the day.
    const gotFirst = await waitUntil(async () => (await Notification.countDocuments({ type: "security" })) === 1);
    assert.ok(gotFirst, "one admin notification after the first attempt");
    const note = await Notification.findOne({ type: "security" });
    assert.ok(note.recipients.map(String).includes(String(admin._id)), "notification targets the admin");
    assert.ok(/riya/i.test(note.body) || /riya/i.test(note.title), "notification names the student");
    ok("admins are notified once, targeted, naming the student");

    // ---- Same attempt again the same day: de-duped, no new notification ----
    const r2 = await request
        .post("/api/security/report")
        .set(...auth(studentToken))
        .send({ type: "screenshot", contentType: "note" });
    assert.strictEqual(r2.status, 200);
    const ev2 = await SecurityEvent.findOne({ user: student._id, type: "screenshot" });
    assert.strictEqual(ev2.count, 2, "repeat of the same type just bumps the count");
    // Give any (unwanted) second notification a chance to appear, then assert it didn't.
    await new Promise((r) => setTimeout(r, 150));
    assert.strictEqual(
        await Notification.countDocuments({ type: "security" }),
        1,
        "a repeat attempt must NOT spam a second notification"
    );
    ok("repeat same-day attempts de-dupe (count bumps, no notification spam)");

    // ---- A different attempt type is a separate row + its own notification -
    const r3 = await request
        .post("/api/security/report")
        .set(...auth(studentToken))
        .send({ type: "copy", contentType: "test" });
    assert.strictEqual(r3.status, 200);
    const gotSecond = await waitUntil(async () => (await Notification.countDocuments({ type: "security" })) === 2);
    assert.ok(gotSecond, "a different attempt type notifies again");
    ok("a different attempt type logs separately and notifies");

    // ---- Unknown event types are rejected ---------------------------------
    const bad = await request.post("/api/security/report").set(...auth(studentToken)).send({ type: "hack" });
    assert.strictEqual(bad.status, 400);
    ok("unknown event types are rejected (400)");

    // ---- Admin can list alerts, rolled up per student ---------------------
    const list = await request.get("/api/security/alerts").set(...auth(adminToken));
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.body.alerts.length, 2, "two rows: screenshot + copy");
    assert.strictEqual(list.body.students.length, 1, "rolled up to one student");
    const s = list.body.students[0];
    assert.strictEqual(s.total, 3, "3 total attempts (2 screenshot + 1 copy)");
    assert.strictEqual(s.types.screenshot, 2);
    assert.strictEqual(s.types.copy, 1);
    ok("admin sees a per-student rollup with type breakdown");

    // ---- A student cannot read the alerts ---------------------------------
    const forbidden = await request.get("/api/security/alerts").set(...auth(studentToken));
    assert.strictEqual(forbidden.status, 403);
    ok("students are blocked from the alerts feed (403)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} content-protection checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
