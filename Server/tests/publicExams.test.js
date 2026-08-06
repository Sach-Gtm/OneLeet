// The PUBLIC (no-login) exam-exploration APIs that back the marketing EXAMS
// pages. A visitor with NO token can read pattern / syllabus / seat-matrix /
// cut-offs / sample PYQs, with premium chapters and PYQ downloads withheld.
// Run: node tests/publicExams.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const ExamPattern = require("../src/models/examPatternModel");
const Syllabus = require("../src/models/syllabusModel");
const Pyq = require("../src/models/pyqModel");
const SeatMatrix = require("../src/models/seatMatrixModel");
const CutoffMatrix = require("../src/models/cutoffMatrixModel");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "A", email: "a@t.com", password: "secret123", phone: "9000000001", role: "admin", isVerified: true, authProvider: "local" });

    await ExamPattern.create({ examCode: "ipu-leet", examName: "IPU LEET (GGSIPU)", eligibility: "Diploma with 45%.", published: true, createdBy: admin._id });
    // One free + one premium global syllabus targeting IPU, plus a universal one.
    await Syllabus.create({ title: "IPU Maths", subject: "Mathematics", targets: ["ipu-leet"], scope: "global", published: true, premium: false, chapters: [{ title: "Algebra", topics: [{ title: "Matrices", estimatedHours: 2 }] }], createdBy: admin._id });
    await Syllabus.create({ title: "IPU Premium Physics", subject: "Physics", targets: ["ipu-leet"], scope: "global", published: true, premium: true, chapters: [{ title: "Mechanics", topics: [{ title: "Kinematics", estimatedHours: 3 }] }], createdBy: admin._id });
    // A DTU-only syllabus that must NOT show under IPU.
    await Syllabus.create({ title: "DTU Only", subject: "Chem", targets: ["dtu-nsut-leet"], scope: "global", published: true, createdBy: admin._id });
    await SeatMatrix.create({ examCode: "ipu-leet", examName: "IPU LEET (GGSIPU)", published: true, totalSeats: 100, colleges: [{ name: "BPIT" }, { name: "AIACTR" }] });
    await CutoffMatrix.create({ examCode: "ipu-leet", examName: "IPU LEET (GGSIPU)", published: true, rounds: [{ round: 1 }] });
    await Pyq.create({ title: "IPU 2024 Paper", year: 2024, stateExam: "ipu-leet", subject: "Full Paper", fileUrl: "https://x/y.pdf", uploadedBy: admin._id });

    // Catalog is public.
    const cat = await request.get("/api/public/exams");
    assert.strictEqual(cat.status, 200);
    assert.ok(cat.body.exams.length > 10 && cat.body.exams.some((e) => e.code === "ipu-leet"), "catalog served");
    ok("the exam catalog is public (no token)");

    // Overview flags which panels have data.
    const ov = await request.get("/api/public/exams/ipu-leet/overview");
    assert.strictEqual(ov.status, 200);
    assert.deepStrictEqual(ov.body.has, { pattern: true, eligibility: true, seatMatrix: true, cutoffs: true, syllabus: true, pyqs: true }, "overview reflects seeded data");
    ok("overview reports which sections exist for an exam");

    // Pattern (+ eligibility) is public.
    const pat = await request.get("/api/public/exams/ipu-leet/pattern");
    assert.strictEqual(pat.status, 200);
    assert.strictEqual(pat.body.pattern.eligibility, "Diploma with 45%.", "eligibility rides on the pattern");
    ok("exam pattern + eligibility are public");

    // Syllabus: free chapters shown, premium withheld, other exams excluded.
    const syl = await request.get("/api/public/exams/ipu-leet/syllabus");
    assert.strictEqual(syl.status, 200);
    const titles = syl.body.syllabi.map((s) => s.title).sort();
    assert.deepStrictEqual(titles, ["IPU Maths", "IPU Premium Physics"], "IPU + not DTU");
    const free = syl.body.syllabi.find((s) => s.title === "IPU Maths");
    const prem = syl.body.syllabi.find((s) => s.title === "IPU Premium Physics");
    assert.ok(free.chapters.length > 0, "free syllabus shows its chapters");
    assert.ok(prem.locked === true && prem.chapters.length === 0, "premium syllabus is locked (chapters withheld)");
    ok("syllabus is public to view; premium chapters are locked");

    // Seat matrix + cut-offs are public.
    const seat = await request.get("/api/public/exams/ipu-leet/seat-matrix");
    assert.strictEqual(seat.status, 200);
    assert.ok(seat.body.matrix.colleges.length === 2, "seat matrix served, colleges sorted");
    const cut = await request.get("/api/public/exams/ipu-leet/cutoffs");
    assert.strictEqual(cut.status, 200);
    assert.ok(Array.isArray(cut.body.matrix.rounds), "cut-offs served");
    ok("seat matrix and cut-offs are fully public");

    // Sample PYQs: browsable, but no download URL for a visitor.
    const pq = await request.get("/api/public/exams/ipu-leet/pyqs");
    assert.strictEqual(pq.status, 200);
    assert.strictEqual(pq.body.pyqs.length, 1, "sample PYQ listed");
    assert.strictEqual(pq.body.pyqs[0].fileUrl, undefined, "no download URL for a visitor");
    assert.strictEqual(pq.body.pyqs[0].downloadRequiresLogin, true, "download flagged as login-gated");
    ok("sample PYQs are viewable but downloads are gated");

    // Unknown / "all" codes are a clean 404.
    assert.strictEqual((await request.get("/api/public/exams/totally-fake/pattern")).status, 404, "bogus code 404");
    assert.strictEqual((await request.get("/api/public/exams/all/pattern")).status, 404, "'all' rejected");
    ok("an unknown or 'all' exam code is a clean 404");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} public-exams checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ PUBLIC-EXAMS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
