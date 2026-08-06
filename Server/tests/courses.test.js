// Course + Enrollment: admin CRUD, public catalog (published only), free enroll /
// unenroll, the user.exams cache sync, and guards. Run: node tests/courses.test.js
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
const Enrollment = require("../src/models/enrollmentModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "A", email: "a@t.com", password: "secret123", phone: "9000000001", role: "admin", isVerified: true, authProvider: "local" });
    const mentor = await User.create({ name: "M", email: "m@t.com", password: "secret123", phone: "9000000002", role: "teacher", isVerified: true, authProvider: "local" });
    const student = await User.create({ name: "S", email: "s@t.com", password: "secret123", phone: "9000000003", role: "student", isVerified: true, authProvider: "local" });
    const adminT = generateToken(admin._id);
    const mentorT = generateToken(mentor._id);
    const studentT = generateToken(student._id);

    // Admin creates a published course; students/mentors can't.
    const mk = (token, body) => request.post("/api/courses").set(...auth(token)).send(body);
    const created = await mk(adminT, { name: "IPU LEET 2027 Foundation Batch", examCode: "ipu-leet", published: true, price: 2999, mrp: 4999 });
    assert.strictEqual(created.status, 201, "admin creates a course");
    assert.strictEqual(created.body.course.slug, "ipu-leet-2027-foundation-batch", "slug derived from the name");
    assert.strictEqual(created.body.course.examName, "IPU LEET (GGSIPU)", "examName filled from the catalog");
    assert.strictEqual((await mk(studentT, { name: "x", examCode: "ipu-leet" })).status, 403, "student can't create");
    assert.strictEqual((await mk(mentorT, { name: "x", examCode: "ipu-leet" })).status, 403, "mentor can't create");
    ok("only admins create courses; slug + examName are derived");

    // examCode must be a real single exam — never "all", never bogus, name required.
    assert.strictEqual((await mk(adminT, { name: "x", examCode: "all" })).status, 400, "'all' rejected");
    assert.strictEqual((await mk(adminT, { name: "x", examCode: "totally-fake" })).status, 400, "bogus code rejected");
    assert.strictEqual((await mk(adminT, { examCode: "ipu-leet" })).status, 400, "missing name rejected");
    ok("a course must target one valid exam and have a name");

    // A draft (unpublished) course is hidden from the public catalog + slug.
    const draft = await mk(adminT, { name: "DTU / NSUT LEET 2027 Foundation Batch", examCode: "dtu-nsut-leet", published: false });
    assert.strictEqual(draft.status, 201);
    const pub = await request.get("/api/courses"); // no auth
    assert.strictEqual(pub.status, 200);
    assert.strictEqual(pub.body.courses.length, 1, "public catalog shows only the published course");
    assert.strictEqual(pub.body.courses[0].slug, "ipu-leet-2027-foundation-batch");
    assert.strictEqual((await request.get(`/api/courses/${draft.body.course.slug}`)).status, 404, "draft slug is 404 to the public");
    assert.strictEqual((await request.get("/api/courses/manage").set(...auth(adminT))).body.courses.length, 2, "admin manage sees both");
    assert.strictEqual((await request.get("/api/courses/manage").set(...auth(studentT))).status, 403, "student can't hit manage");
    ok("public catalog shows published only; admins see drafts via /manage");

    // Free enrollment: the student joins, user.exams syncs, /me lists it.
    const slug = created.body.course.slug;
    const enr = await request.post("/api/enrollments").set(...auth(studentT)).send({ slug });
    assert.strictEqual(enr.status, 200, "enroll ok");
    assert.deepStrictEqual(enr.body.exams, ["ipu-leet"], "user.exams cache gets the exam code");
    let me = await request.get("/api/enrollments/me").set(...auth(studentT));
    assert.strictEqual(me.body.courses.length, 1, "my enrollments lists the course");
    assert.strictEqual(me.body.courses[0].course.slug, slug);
    assert.strictEqual((await User.findById(student._id)).exams[0], "ipu-leet", "exams persisted on the user");
    ok("a student free-enrolls; user.exams cache is synced from enrollments");

    // Enrolling again is idempotent (no duplicate, no error).
    assert.strictEqual((await request.post("/api/enrollments").set(...auth(studentT)).send({ slug })).status, 200, "re-enroll ok");
    assert.strictEqual(await Enrollment.countDocuments({ student: student._id }), 1, "no duplicate enrollment");
    ok("re-enrolling is idempotent");

    // Enrolling in a missing/unpublished course fails cleanly.
    assert.strictEqual((await request.post("/api/enrollments").set(...auth(studentT)).send({ slug: "nope" })).status, 404, "unknown course 404");
    assert.strictEqual((await request.post("/api/enrollments").set(...auth(studentT)).send({ slug: draft.body.course.slug })).status, 404, "can't enroll in a draft");
    ok("enrolling in an unknown or unpublished course is a clean 404");

    // Un-enroll: enrollment removed, user.exams recomputed to empty.
    const un = await request.delete(`/api/enrollments/${created.body.course._id}`).set(...auth(studentT));
    assert.strictEqual(un.status, 200, "unenroll ok");
    assert.deepStrictEqual(un.body.exams, [], "user.exams recomputed to empty");
    me = await request.get("/api/enrollments/me").set(...auth(studentT));
    assert.strictEqual(me.body.courses.length, 0, "my enrollments now empty");
    assert.strictEqual((await request.delete(`/api/enrollments/${created.body.course._id}`).set(...auth(studentT))).status, 404, "unenroll when not enrolled 404");
    ok("un-enrolling removes access and recomputes the exams cache");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} course/enrollment checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ COURSES TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
