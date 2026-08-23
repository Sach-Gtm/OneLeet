// Verifies (1) the one-time DTU+NSUT merge migration folds the two old exam
// codes into the combined "dtu-nsut-leet" everywhere (catalog, student picks,
// content targets, exam patterns) and is idempotent, and (2) the DTU/NSUT
// syllabus seeds unit/chapter-wise, targeted to the combined exam, once.
// Run: node tests/dtuNsut.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

require("../app");
const User = require("../src/models/userModel");
const Exam = require("../src/models/examModel");
const Syllabus = require("../src/models/syllabusModel");
const ExamPattern = require("../src/models/examPatternModel");
const { ensureExamsSeeded, getExams } = require("../src/config/exams");
const { ensureDtuNsutMerged } = require("../src/config/seedMergeDtuNsut");
const { DTU_NSUT_SYLLABUS, ensureDtuNsutSyllabusSeeded } = require("../src/config/seedDtuNsutSyllabus");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await ensureExamsSeeded();

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });

    // Simulate a pre-existing DB that still has the two OLD split exams + data
    // pointed at them (as production does before the migration runs).
    await Exam.create([
        { code: "dtu-leet", name: "DTU Lateral Entry", group: "Delhi NCR", order: 1 },
        { code: "nsut-leet", name: "NSUT Lateral Entry", group: "Delhi NCR", order: 2 },
    ]);
    const stu = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000002", role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet", "dtu-leet"] });
    const syl = await Syllabus.create({ title: "T", subject: "T", targets: ["nsut-leet"], createdBy: admin._id, chapters: [] });
    const sylBoth = await Syllabus.create({ title: "U", subject: "U", targets: ["dtu-leet", "up-leet"], createdBy: admin._id, chapters: [] });
    const pat = await ExamPattern.create({ examCode: "dtu-leet", examName: "DTU Lateral Entry" });

    // ── The migration ──
    await ensureDtuNsutMerged();

    // Catalog: old two gone, combined present.
    assert.strictEqual(await Exam.countDocuments({ code: { $in: ["dtu-leet", "nsut-leet"] } }), 0, "old exams removed");
    assert.ok(await Exam.exists({ code: "dtu-nsut-leet" }), "combined exam present");
    assert.ok(getExams().some((e) => e.code === "dtu-nsut-leet"), "cache has the combined exam");
    assert.ok(!getExams().some((e) => e.code === "dtu-leet" || e.code === "nsut-leet"), "cache dropped the old exams");
    ok("catalog: DTU + NSUT folded into a single dtu-nsut-leet");

    // Student picks re-pointed (old replaced, ipu-leet kept, deduped).
    const s2 = await User.findById(stu._id).lean();
    assert.deepStrictEqual([...s2.exams].sort(), ["dtu-nsut-leet", "ipu-leet"], "student exams migrated + deduped");
    ok("student exam choices re-pointed to the combined exam");

    // Content targets re-pointed.
    const syl2 = await Syllabus.findById(syl._id).lean();
    assert.deepStrictEqual(syl2.targets, ["dtu-nsut-leet"], "nsut-only syllabus re-pointed");
    const sylBoth2 = await Syllabus.findById(sylBoth._id).lean();
    assert.deepStrictEqual([...sylBoth2.targets].sort(), ["dtu-nsut-leet", "up-leet"], "dtu+up syllabus keeps up-leet, swaps dtu");
    ok("content targeting re-pointed (other targets preserved)");

    // Exam pattern re-keyed.
    const pat2 = await ExamPattern.findById(pat._id).lean();
    assert.strictEqual(pat2.examCode, "dtu-nsut-leet", "exam pattern re-keyed");
    ok("exam patterns re-keyed to the combined exam");

    // Idempotent: a second run changes nothing.
    await ensureDtuNsutMerged();
    assert.strictEqual(await Exam.countDocuments({ code: "dtu-nsut-leet" }), 1, "still exactly one combined exam after re-run");
    ok("merge is idempotent (SeedFlag-guarded)");

    // ── The syllabus seed ──
    await ensureDtuNsutSyllabusSeeded();
    const subjects = await Syllabus.find({ targets: "dtu-nsut-leet", scope: "global" }).lean();
    const bySubject = Object.fromEntries(subjects.map((s) => [s.subject, s]));
    assert.ok(bySubject["Mathematics"] && bySubject["Reasoning"] && bySubject["Quantitative Aptitude"], "three DTU/NSUT subjects seeded");
    assert.strictEqual(bySubject["Mathematics"].chapters.length, 8, "Mathematics has 8 units");
    assert.strictEqual(bySubject["Reasoning"].chapters.length, 12, "Reasoning has 12 units");
    assert.strictEqual(bySubject["Quantitative Aptitude"].chapters.length, 4, "Quant has 4 units (13–16)");
    subjects.forEach((s) => s.chapters.forEach((c) => {
        assert.ok(/^Unit \d+,/.test(c.title), `chapter titled by unit: ${c.title}`);
        assert.ok(c.topics.length > 0, `${c.title} has topics`);
    }));
    ok("DTU/NSUT syllabus seeds unit/chapter-wise, targeted to the combined exam");

    // Well-formed source data + idempotent re-seed.
    const totalTopics = DTU_NSUT_SYLLABUS.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.topics.length, 0), 0);
    assert.ok(totalTopics >= 60, "a substantial topic list");
    const seededSubjects = DTU_NSUT_SYLLABUS.map((s) => s.subject);
    await ensureDtuNsutSyllabusSeeded();
    assert.strictEqual(
        await Syllabus.countDocuments({ targets: "dtu-nsut-leet", scope: "global", subject: { $in: seededSubjects } }),
        3,
        "no duplicate subjects on re-seed"
    );
    ok("syllabus re-seeding is a no-op");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} DTU/NSUT checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ DTU/NSUT TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
