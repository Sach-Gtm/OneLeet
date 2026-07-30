// Tests the seeded IPU LEET syllabus: it publishes once (idempotent), targets
// the ipu-leet exam with the right subjects/chapters/topics and per-subject hour
// estimates, and a student preparing for IPU LEET sees it while others don't.
// Run: node tests/ipuSyllabus.test.js
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
const Syllabus = require("../src/models/syllabusModel");
const generateToken = require("../src/utils/generateToken");
const { ensureExamsSeeded } = require("../src/config/exams");
const { ensureIpuSyllabusSeeded, IPU_LEET_SYLLABUS } = require("../src/config/seedIpuSyllabus");

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

    // No admin yet → seed is a safe no-op (createdBy is required).
    await ensureIpuSyllabusSeeded();
    assert.strictEqual(await Syllabus.countDocuments({ targets: "ipu-leet" }), 0, "no seed without an admin");
    ok("seeding is a safe no-op when there is no admin to attribute it to");

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "superadmin", isVerified: true, authProvider: "local",
    });
    const ipuStudent = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    const dtuStudent = await User.create({
        name: "D", email: "d@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local", exams: ["dtu-leet"],
    });

    // Seed for real now.
    await ensureIpuSyllabusSeeded();
    const count = await Syllabus.countDocuments({ targets: "ipu-leet", published: true, scope: "global" });
    assert.strictEqual(count, IPU_LEET_SYLLABUS.length, `all ${IPU_LEET_SYLLABUS.length} subjects seeded, published & global`);
    ok(`the ${IPU_LEET_SYLLABUS.length} IPU LEET subjects are seeded (published, global, targeted to ipu-leet)`);

    // Structure + per-subject hours are correct.
    const maths = await Syllabus.findOne({ targets: "ipu-leet", subject: "Applied Mathematics" }).lean();
    assert.ok(maths, "Applied Mathematics exists");
    const calc = maths.chapters.find((c) => c.title === "Calculus");
    assert.ok(calc && calc.topics.some((t) => t.title === "Limits and continuity"), "Calculus → Limits and continuity");
    assert.strictEqual(calc.topics[0].estimatedHours, 1.5, "maths topics are 1.5h each");
    const mech = await Syllabus.findOne({ targets: "ipu-leet", subject: "Applied Mechanics" }).lean();
    assert.strictEqual(mech.chapters[0].topics[0].estimatedHours, 1, "mechanics topics are 1h each");
    const reasoning = await Syllabus.findOne({ targets: "ipu-leet", subject: "Reasoning" }).lean();
    assert.strictEqual(reasoning.chapters[0].topics[0].estimatedHours, 0.5, "reasoning topics are 0.5h each");
    ok("subjects carry the right chapters/topics and per-subject hour estimates");

    // Physics + Chemistry are one combined subject; Reasoning, Aptitude and
    // Computer Awareness stay separate.
    const pc = await Syllabus.findOne({ targets: "ipu-leet", subject: "Physics & Chemistry" }).lean();
    assert.ok(pc, "Physics & Chemistry is a single subject");
    assert.ok(
        pc.chapters.some((c) => c.title === "Units and Measurement") && pc.chapters.some((c) => c.title === "Structure of Atom"),
        "it holds both physics and chemistry chapters"
    );
    assert.ok(!(await Syllabus.exists({ targets: "ipu-leet", subject: "Physics" })), "no standalone Physics");
    assert.ok(!(await Syllabus.exists({ targets: "ipu-leet", subject: "Chemistry" })), "no standalone Chemistry");
    assert.ok(await Syllabus.exists({ targets: "ipu-leet", subject: "Quantitative Aptitude" }), "Aptitude stays separate");
    assert.ok(await Syllabus.exists({ targets: "ipu-leet", subject: "Computer Awareness" }), "Computer Awareness stays separate");
    ok("Physics & Chemistry are combined; Reasoning, Aptitude and Computer Awareness stay separate");

    // No coaching-ad noise leaked into any title.
    const all = await Syllabus.find({ targets: "ipu-leet" }).lean();
    const blob = JSON.stringify(all).toLowerCase();
    ["mission engineering", "coaching in delhi", "9582202651", "youtube", "cut off", "best leet"].forEach((junk) => {
        assert.ok(!blob.includes(junk), `no ad noise: "${junk}"`);
    });
    ok("the pasted coaching-ad text is fully stripped out");

    // An IPU LEET student sees all the subjects; a DTU student sees none of them.
    const ipuList = (await request.get("/api/syllabus").set(...auth(generateToken(ipuStudent._id)))).body.syllabi;
    assert.strictEqual(ipuList.filter((s) => s.targets.includes("ipu-leet")).length, IPU_LEET_SYLLABUS.length, "ipu student sees all subjects");
    const dtuList = (await request.get("/api/syllabus").set(...auth(generateToken(dtuStudent._id)))).body.syllabi;
    assert.strictEqual(dtuList.filter((s) => s.targets.includes("ipu-leet")).length, 0, "dtu student sees none of the ipu subjects");
    ok("only students preparing for IPU LEET see the IPU LEET syllabus");

    // Idempotent: re-seeding doesn't duplicate.
    await ensureIpuSyllabusSeeded();
    assert.strictEqual(await Syllabus.countDocuments({ targets: "ipu-leet" }), IPU_LEET_SYLLABUS.length, "no duplicates on re-seed");
    ok("re-seeding is a no-op (no duplicates)");

    // Staff can still edit/delete them (they're ordinary records) — a delete
    // followed by a re-seed WON'T resurrect it because other ipu-leet syllabi
    // still exist.
    await Syllabus.deleteOne({ _id: maths._id });
    await ensureIpuSyllabusSeeded();
    assert.strictEqual(await Syllabus.countDocuments({ targets: "ipu-leet" }), IPU_LEET_SYLLABUS.length - 1, "deleted subject stays deleted");
    ok("a staff-deleted subject is not resurrected by a later boot");

    // Migration: a previously-seeded split Physics + Chemistry is merged on boot,
    // carrying whatever chapters exist (so staff edits are preserved).
    await Syllabus.deleteMany({ targets: "ipu-leet" });
    await Syllabus.create([
        { title: "Physics", subject: "Physics", exam: "IPU LEET", targets: ["ipu-leet"], published: true, scope: "global", order: 6, createdBy: admin._id, chapters: [{ title: "Units and Measurement", order: 0, topics: [{ title: "SI units", estimatedHours: 0.5, order: 0 }] }] },
        { title: "Chemistry", subject: "Chemistry", exam: "IPU LEET", targets: ["ipu-leet"], published: true, scope: "global", order: 7, createdBy: admin._id, chapters: [{ title: "Structure of Atom", order: 0, topics: [{ title: "Atomic models", estimatedHours: 0.5, order: 0 }] }] },
    ]);
    await ensureIpuSyllabusSeeded();
    assert.ok(!(await Syllabus.exists({ targets: "ipu-leet", subject: "Physics" })), "standalone Physics gone");
    assert.ok(!(await Syllabus.exists({ targets: "ipu-leet", subject: "Chemistry" })), "standalone Chemistry gone");
    const merged = await Syllabus.findOne({ targets: "ipu-leet", subject: "Physics & Chemistry" }).lean();
    assert.ok(merged, "combined subject created");
    assert.strictEqual(merged.chapters.length, 2, "both chapters carried over (edit-preserving)");
    ok("a previously split Physics + Chemistry is merged into one subject on boot");

    await ensureIpuSyllabusSeeded();
    assert.strictEqual(await Syllabus.countDocuments({ targets: "ipu-leet", subject: "Physics & Chemistry" }), 1, "merge is idempotent");
    ok("the Physics + Chemistry merge runs only once");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} IPU-syllabus checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ IPU SYLLABUS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
