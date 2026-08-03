// Tests for exam paper patterns: ADMIN-only create/update/delete, and a student
// seeing ONLY the published patterns for the exams they picked in their profile.
// Run: node tests/examPattern.test.js
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
const generateToken = require("../src/utils/generateToken");
const { ensureExamsSeeded } = require("../src/config/exams");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await ensureExamsSeeded(); // makes exam codes valid, as on a real boot

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "admin", isVerified: true, authProvider: "local",
    });
    const teacher = await User.create({
        name: "Mentor", email: "m@t.com", password: "secret123", phone: "9000000002",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    // Student prepping for IPU LEET only.
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    // Student who hasn't picked any exams yet.
    const noExamStudent = await User.create({
        name: "N", email: "n@t.com", password: "secret123", phone: "9000000004",
        role: "student", isVerified: true, authProvider: "local", exams: [],
    });
    const adminToken = generateToken(admin._id);
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);
    const noExamToken = generateToken(noExamStudent._id);

    // Non-admins cannot create.
    const sForbid = await request.post("/api/exam-patterns").set(...auth(studentToken)).send({ examCode: "ipu-leet", examName: "X" });
    assert.strictEqual(sForbid.status, 403, "student cannot create");
    const tForbid = await request.post("/api/exam-patterns").set(...auth(teacherToken)).send({ examCode: "ipu-leet", examName: "X" });
    assert.strictEqual(tForbid.status, 403, "mentor cannot create");
    ok("only admins can create patterns (students and mentors get 403)");

    // Invalid exam code rejected.
    const badCode = await request.post("/api/exam-patterns").set(...auth(adminToken)).send({ examCode: "not-a-real-exam", examName: "X" });
    assert.strictEqual(badCode.status, 400, "invalid exam code rejected");
    ok("a pattern for an unknown exam code is rejected");

    // Admin creates a rich IPU LEET pattern.
    const create = await request
        .post("/api/exam-patterns")
        .set(...auth(adminToken))
        .send({
            examCode: "ipu-leet",
            examName: "IPU LEET (GGSIPU)",
            conductingBody: "GGSIPU",
            place: "Delhi NCR",
            eligibility: "3-year engineering diploma with 45% marks.",
            fees: "₹1,500 (Gen), ₹1,000 (SC/ST)",
            examMode: "Online (CBT)",
            duration: "2 hours 30 minutes",
            totalQuestions: 150,
            totalMarks: 600,
            sections: [
                { name: "Mathematics", subjects: "Algebra, Calculus", questions: 50, marks: 200, difficulty: "Hard" },
                { name: "Analytical", subjects: "Reasoning", questions: 50, marks: 200, difficulty: "Moderate" },
                // Blank row should be dropped.
                { name: "", subjects: "", questions: "", marks: "", difficulty: "" },
            ],
            markingCorrect: "+4",
            markingNegative: "-1",
            avgPlacement: "₹6–8 LPA",
            topColleges: [
                { name: "USICT", location: "Dwarka, Delhi", avgPackage: "₹9 LPA" },
                { name: "", location: "nowhere" }, // dropped (no name)
            ],
            seatIntake: [
                { college: "USICT", course: "CSE", seats: 60, note: "GGSIPU" },
                { college: "MSIT", seats: 120 },
                { college: "", seats: "" }, // dropped (no college, no seats)
            ],
            importantDates: "Applications: Mar–Apr. Exam: May.",
        });
    assert.strictEqual(create.status, 201, "admin creates a pattern");
    assert.strictEqual(create.body.pattern.sections.length, 2, "blank section dropped");
    assert.strictEqual(create.body.pattern.topColleges.length, 1, "nameless college dropped");
    assert.strictEqual(create.body.pattern.seatIntake.length, 2, "blank seat-intake row dropped");
    assert.strictEqual(create.body.pattern.seatIntake[0].seats, 60, "seat count round-trips");
    assert.strictEqual(create.body.pattern.markingNegative, "-1");
    const patternId = create.body.pattern._id;
    ok("an admin creates a rich pattern; blank section/college rows are cleaned");

    // Create an UNPUBLISHED DTU pattern (student prepping for IPU shouldn't see it).
    const dtu = await request.post("/api/exam-patterns").set(...auth(adminToken)).send({
        examCode: "dtu-nsut-leet", examName: "DTU Lateral Entry", published: false,
    });
    assert.strictEqual(dtu.status, 201);
    // And a published one for an exam the student didn't pick.
    await request.post("/api/exam-patterns").set(...auth(adminToken)).send({
        examCode: "up-leet", examName: "UP LEET (AKTU)",
    });
    ok("admin creates additional patterns (one unpublished, one for another exam)");

    // Student /me returns ONLY their published IPU pattern.
    const mine = await request.get("/api/exam-patterns/me").set(...auth(studentToken));
    assert.strictEqual(mine.status, 200);
    assert.strictEqual(mine.body.patterns.length, 1, "student sees exactly one pattern");
    assert.strictEqual(mine.body.patterns[0].examCode, "ipu-leet", "and it's their exam");
    assert.strictEqual(mine.body.patterns[0].examName, "IPU LEET (GGSIPU)");
    ok("a student sees only the published pattern(s) for the exam(s) they picked");

    // Student with no exams gets an empty list (not an error).
    const none = await request.get("/api/exam-patterns/me").set(...auth(noExamToken));
    assert.strictEqual(none.status, 200);
    assert.strictEqual(none.body.patterns.length, 0, "no exams → no patterns");
    ok("a student who picked no exams gets an empty list");

    // Admin list shows everything (published + unpublished): 3 total.
    const all = await request.get("/api/exam-patterns").set(...auth(adminToken));
    assert.strictEqual(all.body.patterns.length, 3, "admin sees all three");
    const allForbid = await request.get("/api/exam-patterns").set(...auth(studentToken));
    assert.strictEqual(allForbid.status, 403, "student cannot list all");
    ok("admin lists every pattern; students cannot hit the admin list");

    // Admin updates the IPU pattern's fees.
    const upd = await request.patch(`/api/exam-patterns/${patternId}`).set(...auth(adminToken)).send({
        examName: "IPU LEET (GGSIPU)", fees: "₹2,000",
    });
    assert.strictEqual(upd.status, 200);
    assert.strictEqual(upd.body.pattern.fees, "₹2,000", "fees updated");
    ok("an admin updates a pattern");

    // Admin deletes it; student can't.
    const delForbid = await request.delete(`/api/exam-patterns/${patternId}`).set(...auth(studentToken));
    assert.strictEqual(delForbid.status, 403, "student cannot delete");
    const del = await request.delete(`/api/exam-patterns/${patternId}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin deletes");
    const afterDel = await request.get("/api/exam-patterns/me").set(...auth(studentToken));
    assert.strictEqual(afterDel.body.patterns.length, 0, "deleted pattern gone from student view");
    ok("an admin deletes a pattern; students cannot");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} exam-pattern checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ EXAM PATTERN TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
