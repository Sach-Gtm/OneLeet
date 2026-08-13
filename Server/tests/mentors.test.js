// Tests for mentor profiles: PUBLIC read (no auth), ADMIN-only add/delete, and
// the founding-mentor seed. Photo upload (Cloudinary) isn't exercised here — we
// add mentors without a photo. Run: node tests/mentors.test.js
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
const Mentor = require("../src/models/mentorModel");
const generateToken = require("../src/utils/generateToken");
const { ensureMentorsSeeded } = require("../src/config/seedMentors");
const { ensureMentorJourneysSeeded } = require("../src/config/seedMentorJourneys");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // Seeding populates the three founding mentors when the collection is empty.
    await ensureMentorsSeeded();
    const seeded = (await request.get("/api/mentors")).body.mentors;
    assert.strictEqual(seeded.length, 3, "three founding mentors seeded");
    assert.ok(seeded.some((m) => m.name === "Parth Singh Shekhawat"), "Parth is seeded");
    ok("the founding mentors are seeded and publicly readable (no auth)");

    // Seeding again is a no-op (doesn't duplicate).
    await ensureMentorsSeeded();
    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 3, "no duplicate seeding");
    ok("re-seeding is a no-op");

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "admin", isVerified: true, authProvider: "local",
    });
    const teacher = await User.create({
        name: "Mentor", email: "m@t.com", password: "secret123", phone: "9000000002",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000003",
        role: "student", isVerified: true, authProvider: "local",
    });
    const adminToken = generateToken(admin._id);
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);

    // Neither student nor mentor can add — admin only.
    const sForbid = await request.post("/api/mentors").set(...auth(studentToken)).send({ name: "X" });
    assert.strictEqual(sForbid.status, 403, "student cannot add");
    const tForbid = await request.post("/api/mentors").set(...auth(teacherToken)).send({ name: "X" });
    assert.strictEqual(tForbid.status, 403, "mentor cannot add");
    ok("only admins can add mentors (students and mentors get 403)");

    // Admin adds a mentor (with a description, no photo).
    const add = await request
        .post("/api/mentors")
        .set(...auth(adminToken))
        .send({ name: "Riya Sharma", exam: "DTU LEET 2024", description: "Cracked it in her first attempt." });
    assert.strictEqual(add.status, 201, "admin adds a mentor");
    assert.strictEqual(add.body.mentor.name, "Riya Sharma");
    assert.strictEqual(add.body.mentor.description, "Cracked it in her first attempt.");
    assert.strictEqual(add.body.mentor.photo, null, "no photo when none uploaded");
    const newId = add.body.mentor._id;
    ok("an admin adds a mentor with a description");

    // A nameless mentor is rejected.
    const noName = await request.post("/api/mentors").set(...auth(adminToken)).send({ exam: "x" });
    assert.strictEqual(noName.status, 400, "name is required");
    ok("a mentor without a name is rejected");

    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 4, "now four mentors");

    // Admin deletes the added mentor.
    const del = await request.delete(`/api/mentors/${newId}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin deletes a mentor");
    // A student can't delete.
    const delForbid = await request.delete(`/api/mentors/${seeded[0]._id}`).set(...auth(studentToken));
    assert.strictEqual(delForbid.status, 403, "student cannot delete");
    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 3, "back to three");
    ok("an admin can delete a mentor; students cannot");

    // ── Journeys: rich content, detail-by-slug, admin edit, drafts, migration ──

    // Seeded founding mentors carry a full journey + a slug.
    const sachinCard = (await request.get("/api/mentors")).body.mentors.find((m) => m.slug === "sachin-gautam");
    assert.ok(sachinCard, "sachin has a slug on the card");
    const sachin = (await request.get("/api/mentors/sachin-gautam")).body.mentor;
    assert.ok(sachin.story && sachin.story.length > 100, "journey story present");
    assert.ok(sachin.highlights.length >= 3 && sachin.stats.length >= 3, "highlights + stats present");
    ok("founding mentors carry a full journey (slug, story, highlights, stats) readable by slug");

    // Admin creates a rich mentor — slug auto-generated, arrays parsed, unsafe link dropped.
    const rich = await request.post("/api/mentors").set(...auth(adminToken)).send({
        name: "Neha Verma",
        role: "Mentor",
        tagline: "Rank 12 with a part-time job.",
        highlights: JSON.stringify(["Rank 12 in IPU LEET", "Worked part-time throughout"]),
        stats: JSON.stringify([{ value: "12", label: "IPU LEET Rank" }]),
        links: JSON.stringify([
            { label: "oneleet.in", url: "https://oneleet.in" },
            { label: "bad", url: "javascript:alert(1)" },
        ]),
    });
    assert.strictEqual(rich.status, 201, "admin creates a rich mentor");
    assert.strictEqual(rich.body.mentor.slug, "neha-verma", "slug auto-generated from name");
    assert.strictEqual(rich.body.mentor.highlights.length, 2, "highlights parsed");
    assert.strictEqual(rich.body.mentor.stats[0].value, "12", "stats parsed");
    assert.strictEqual(rich.body.mentor.links.length, 1, "only http(s) links kept (javascript: dropped)");
    const richId = rich.body.mentor._id;
    ok("an admin creates a mentor with role/tagline/highlights/stats/links (slug auto, unsafe link dropped)");

    // Admin-only full list carries every field; students are refused.
    assert.strictEqual((await request.get("/api/mentors/admin/all").set(...auth(studentToken))).status, 403, "student 403 on admin list");
    const all = await request.get("/api/mentors/admin/all").set(...auth(adminToken));
    const nehaInAll = all.body.mentors.find((m) => m.slug === "neha-verma");
    assert.ok(nehaInAll && nehaInAll.tagline === "Rank 12 with a part-time job.", "admin list includes the new mentor with its fields");
    assert.ok(all.body.mentors.some((m) => typeof m.story === "string" && m.story.length > 50), "admin list carries the full journey (detail shape)");
    ok("the admin full list is admin-only and carries every field");

    // Update (PATCH) — admin only.
    assert.strictEqual((await request.patch(`/api/mentors/${richId}`).set(...auth(studentToken)).send({ tagline: "x" })).status, 403, "student cannot update");
    const patched = await request.patch(`/api/mentors/${richId}`).set(...auth(adminToken)).send({ tagline: "Updated line", published: "false" });
    assert.strictEqual(patched.status, 200, "admin updates");
    assert.strictEqual(patched.body.mentor.tagline, "Updated line", "field updated");
    ok("an admin can edit a mentor's fields; students cannot");

    // An unpublished mentor drops out of the public page but stays in the admin list.
    assert.ok(!(await request.get("/api/mentors")).body.mentors.some((m) => m.slug === "neha-verma"), "hidden mentor not in public list");
    assert.strictEqual((await request.get("/api/mentors/neha-verma")).status, 404, "hidden mentor detail 404s publicly");
    assert.ok((await request.get("/api/mentors/admin/all").set(...auth(adminToken))).body.mentors.some((m) => m.slug === "neha-verma"), "hidden mentor still in admin list");
    ok("unpublishing hides a mentor from the public page but not from admin");
    await request.delete(`/api/mentors/${richId}`).set(...auth(adminToken)); // cleanup

    // The one-time migration upgrades a legacy bare record and creates missing founders.
    await Mentor.deleteMany({});
    await Mentor.create({ name: "Sachin Gautam" }); // pre-journey record: no slug/story
    await ensureMentorJourneysSeeded();
    const upgraded = (await request.get("/api/mentors/sachin-gautam")).body.mentor;
    assert.ok(upgraded && upgraded.story && upgraded.story.length > 100, "bare record upgraded with a full journey");
    assert.strictEqual((await request.get("/api/mentors")).body.mentors.length, 3, "missing founders created by the migration");
    ok("the one-time migration fills bare records' journeys and creates any missing founders");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} mentor checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ MENTORS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
