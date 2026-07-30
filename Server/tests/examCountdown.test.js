// Tests the exam-date / countdown: admins set & clear an exam date on a pattern,
// students receive it (their client turns it into a live countdown), and the
// IPU LEET pattern is seeded with a ~275-day date on first run (idempotent).
// Run: node tests/examCountdown.test.js
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
const ExamPattern = require("../src/models/examPatternModel");
const generateToken = require("../src/utils/generateToken");
const { ensureExamsSeeded } = require("../src/config/exams");
const { ensureIpuExamPatternSeeded, COUNTDOWN_DAYS } = require("../src/config/seedIpuExamPattern");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await ensureExamsSeeded();

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "superadmin", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    const adminToken = generateToken(admin._id);
    const studentToken = generateToken(student._id);

    // Admin creates a pattern with an exam date.
    const create = await request.post("/api/exam-patterns").set(...auth(adminToken)).send({
        examCode: "ipu-leet", examName: "IPU LEET (GGSIPU)", examDate: "2027-05-01",
    });
    assert.strictEqual(create.status, 201, "created");
    assert.ok(create.body.pattern.examDate, "examDate is stored and returned");
    assert.strictEqual(new Date(create.body.pattern.examDate).toISOString().slice(0, 10), "2027-05-01", "the date round-trips");
    const id = create.body.pattern._id;
    ok("an admin sets an exam date on a pattern and it round-trips");

    // Student receives the date (their client computes the countdown from it).
    const mine = await request.get("/api/exam-patterns/me").set(...auth(studentToken));
    assert.ok(mine.body.patterns[0]?.examDate, "student receives the exam date");
    ok("a student receives the exam date to count down from");

    // Admin edits the date.
    const upd = await request.patch(`/api/exam-patterns/${id}`).set(...auth(adminToken)).send({
        examName: "IPU LEET (GGSIPU)", examDate: "2027-05-15",
    });
    assert.strictEqual(new Date(upd.body.pattern.examDate).toISOString().slice(0, 10), "2027-05-15", "date updated");
    ok("an admin can edit the exam date");

    // Admin clears the date (empty string).
    const cleared = await request.patch(`/api/exam-patterns/${id}`).set(...auth(adminToken)).send({
        examName: "IPU LEET (GGSIPU)", examDate: "",
    });
    assert.ok(!cleared.body.pattern.examDate, "date cleared");
    ok("an admin can clear the exam date");

    // Clean slate, then the seed provides an IPU LEET pattern ~275 days out.
    await ExamPattern.deleteMany({});
    await ensureIpuExamPatternSeeded();
    const seeded = await ExamPattern.findOne({ examCode: "ipu-leet" }).lean();
    assert.ok(seeded, "IPU LEET pattern seeded");
    assert.ok(seeded.examDate, "seeded with an exam date");
    const days = Math.round((new Date(seeded.examDate).getTime() - Date.now()) / 86400000);
    assert.ok(Math.abs(days - COUNTDOWN_DAYS) <= 1, `countdown is ~${COUNTDOWN_DAYS} days (got ${days})`);
    ok(`the IPU LEET pattern is seeded with a ~${COUNTDOWN_DAYS}-day countdown`);

    // Idempotent: re-seeding doesn't add a second one.
    await ensureIpuExamPatternSeeded();
    assert.strictEqual(await ExamPattern.countDocuments({ examCode: "ipu-leet" }), 1, "no duplicate on re-seed");
    ok("re-seeding the IPU LEET pattern is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} exam-countdown checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ EXAM COUNTDOWN TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
