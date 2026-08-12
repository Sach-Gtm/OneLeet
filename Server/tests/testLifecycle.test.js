// Verifies the M4 test-lifecycle notifications: a scheduled graded test firing
// a one-time "went live" alert to its audience, and a competitive test firing a
// one-time "2 hours left" alert to eligible students who haven't attempted.
// Exercises targeting, idempotency, and the recent-window guard. Delivery
// channels (push/email) no-op safely in the harness; we assert the in-app
// Notification the bell reads.
// Run: node tests/testLifecycle.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.BREVO_API_KEY;

require("../app"); // registers models
const User = require("../src/models/userModel");
const Test = require("../src/models/testModel");
const Question = require("../src/models/questionModel");
const Attempt = require("../src/models/attemptModel");
const Notification = require("../src/models/notificationModel");
const { processJustWentLive, processClosingSoon } = require("../src/services/test/testLifecycleService");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const ipuStudent = await User.create({ name: "Ipu", email: "ipu@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local", exams: ["IPU"] });
    const upStudent = await User.create({ name: "Up", email: "up@t.com", password: "secret123", phone: "9000000003", role: "student", isVerified: true, authProvider: "local", exams: ["UP"] });
    const q = await Question.create({ text: "Q", options: ["A", "B"], correctIndex: 0, createdBy: admin._id });
    const now = Date.now();

    // --- Went live: a universal graded test that opened a minute ago ---
    const live = await Test.create({ title: "Universal Live", mode: "test", durationMinutes: 30, questions: [q._id], totalMarks: 1, status: "published", isPublished: true, targets: [], openAt: new Date(now - 60 * 1000), closeAt: new Date(now + 3 * 3600 * 1000), createdBy: admin._id });

    const n1 = await processJustWentLive(now);
    assert.strictEqual(n1, 1, "one test went live");
    const liveNotif = await Notification.findOne({ test: live._id, type: "test-live" });
    assert.ok(liveNotif, "a test-live notification was created");
    const rec = liveNotif.recipients.map(String);
    assert.ok(rec.includes(String(ipuStudent._id)) && rec.includes(String(upStudent._id)), "a universal test notifies every student");
    assert.strictEqual(rec.includes(String(admin._id)), false, "staff are not notified");
    assert.ok((await Test.findById(live._id)).liveNotifiedAt, "the live marker is set");
    ok("a scheduled universal test fires one 'went live' alert to all students");

    // Idempotent: a second pass sends nothing.
    assert.strictEqual(await processJustWentLive(now), 0, "went-live is one-time");
    assert.strictEqual(await Notification.countDocuments({ test: live._id, type: "test-live" }), 1, "no duplicate went-live notification");
    ok("'went live' never double-fires");

    // --- Recent-window guard: a test that opened 5h ago is NOT blasted ---
    const stale = await Test.create({ title: "Old Live", mode: "test", durationMinutes: 30, questions: [q._id], totalMarks: 1, status: "published", isPublished: true, targets: [], openAt: new Date(now - 5 * 3600 * 1000), createdBy: admin._id });
    await processJustWentLive(now);
    assert.strictEqual(await Notification.countDocuments({ test: stale._id }), 0, "a long-open test is not retro-notified");
    ok("the recent-window guard prevents blasting already-open tests");

    // --- 2 hours left: a targeted competitive test closing in 90 min ---
    const closing = await Test.create({ title: "IPU Mock", mode: "test", durationMinutes: 30, questions: [q._id], totalMarks: 1, status: "published", isPublished: true, targets: ["IPU"], closeAt: new Date(now + 90 * 60 * 1000), createdBy: admin._id });
    // The IPU student already attempted → should be skipped; UP student isn't eligible.
    await Attempt.create({ user: ipuStudent._id, test: closing._id, testTitle: closing.title, examCode: "IPU", graded: true, answers: [], score: 0, totalMarks: 1, submittedAt: new Date() });

    const c1 = await processClosingSoon(now);
    assert.strictEqual(c1, 0, "nobody eligible & pending → nothing sent (count is alerts sent)");
    const closeNotif = await Notification.findOne({ test: closing._id, type: "test-closing" });
    // IPU student attempted (skip); UP student not enrolled in IPU (not eligible) → nobody left.
    assert.strictEqual(closeNotif, null, "nobody eligible & pending → no closing notification, and it still claims the marker");
    assert.ok((await Test.findById(closing._id)).closingSoonNotifiedAt, "the closing marker is set even when nobody needs it");
    ok("'2 hours left' targets only eligible students who haven't attempted");

    // A second targeted test with a pending eligible student DOES notify.
    const closing2 = await Test.create({ title: "IPU Mock 2", mode: "test", durationMinutes: 30, questions: [q._id], totalMarks: 1, status: "published", isPublished: true, targets: ["IPU"], closeAt: new Date(now + 100 * 60 * 1000), createdBy: admin._id });
    await processClosingSoon(now);
    const cn2 = await Notification.findOne({ test: closing2._id, type: "test-closing" });
    assert.ok(cn2, "a closing test with a pending eligible student notifies");
    assert.deepStrictEqual(cn2.recipients.map(String), [String(ipuStudent._id)], "only the eligible, not-yet-attempted IPU student is notified");
    ok("'2 hours left' reaches the right pending student and no one else");

    console.log(`\n✅ All ${passed} test-lifecycle checks passed`);
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
