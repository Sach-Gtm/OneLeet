// The one-time cutover from self-chosen `exams` to the enrollment model.
// Existing students keep their access: single/multi-exam users are auto-enrolled
// into matching published batches; "All LEET" users are reset to zero. Run:
// node tests/enrollmentBackfill.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const User = require("../src/models/userModel");
const Course = require("../src/models/courseModel");
const Enrollment = require("../src/models/enrollmentModel");
const SeedFlag = require("../src/models/seedFlagModel");
const { ensureEnrollmentBackfill } = require("../src/config/seedEnrollmentBackfill");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "A", email: "a@t.com", password: "secret123", phone: "9000000001", role: "admin", isVerified: true, authProvider: "local" });

    // A published batch exists for IPU (but NOT for bihar-leet).
    const ipuCourse = await Course.create({ name: "IPU Foundation", slug: "ipu-foundation", examCode: "ipu-leet", examName: "IPU LEET (GGSIPU)", published: true, createdBy: admin._id });

    // Existing students in the old model.
    const single = await User.create({ name: "Single", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"] });
    const all = await User.create({ name: "AllLeet", email: "all@t.com", password: "secret123", phone: "9000000003", role: "student", isVerified: true, authProvider: "local", exams: ["all"] });
    const noCourse = await User.create({ name: "NoCourse", email: "nc@t.com", password: "secret123", phone: "9000000004", role: "student", isVerified: true, authProvider: "local", exams: ["bihar-leet"] });
    const multi = await User.create({ name: "Multi", email: "m@t.com", password: "secret123", phone: "9000000005", role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet", "bihar-leet"] });

    await ensureEnrollmentBackfill();

    // Single-exam student → auto-enrolled into the IPU batch, exams untouched.
    const singleEnr = await Enrollment.findOne({ student: single._id, course: ipuCourse._id });
    assert.ok(singleEnr && singleEnr.status === "active", "single-exam student is enrolled in the matching batch");
    assert.deepStrictEqual((await User.findById(single._id)).exams, ["ipu-leet"], "their exams cache is preserved");
    ok("a single-exam student is auto-enrolled into the matching batch, access preserved");

    // "All LEET" student → reset to zero, no enrollment (lands on the nudge).
    assert.deepStrictEqual((await User.findById(all._id)).exams, [], "All-LEET student is reset to zero exams");
    assert.strictEqual(await Enrollment.countDocuments({ student: all._id }), 0, "All-LEET student has no enrollment");
    ok("an 'All LEET' student is reset to zero (will pick a batch)");

    // Student whose exam has no batch yet → keeps the cache entry, no enrollment.
    assert.deepStrictEqual((await User.findById(noCourse._id)).exams, ["bihar-leet"], "exam with no batch stays in the cache");
    assert.strictEqual(await Enrollment.countDocuments({ student: noCourse._id }), 0, "no enrollment when no batch exists");
    ok("an exam with no batch yet keeps access (cache entry left intact)");

    // Multi-exam student → enrolled only where a batch exists; both codes kept.
    assert.strictEqual(await Enrollment.countDocuments({ student: multi._id }), 1, "multi-exam student enrolled only where a batch exists");
    assert.ok(await Enrollment.findOne({ student: multi._id, course: ipuCourse._id }), "multi-exam student enrolled into IPU");
    assert.deepStrictEqual((await User.findById(multi._id)).exams, ["ipu-leet", "bihar-leet"], "multi-exam cache preserved");
    ok("a multi-exam student is enrolled where batches exist, full access preserved");

    // Idempotent: re-running (flag present) is a no-op; and even without the flag,
    // the ops don't duplicate.
    await ensureEnrollmentBackfill();
    assert.strictEqual(await Enrollment.countDocuments({ student: single._id }), 1, "flag guard: no duplicate on re-run");
    await SeedFlag.deleteOne({ key: "enrollment-backfill-v1" });
    await ensureEnrollmentBackfill();
    assert.strictEqual(await Enrollment.countDocuments({ student: single._id }), 1, "op idempotent: still no duplicate without the flag");
    assert.deepStrictEqual((await User.findById(all._id)).exams, [], "All-LEET stays reset on re-run");
    ok("the backfill is idempotent (flag-guarded and operationally safe)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} enrollment-backfill checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ ENROLLMENT-BACKFILL TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
