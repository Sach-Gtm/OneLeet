// Verifies per-item premium gating across all four content types: a free
// student SEES premium content (locked) but can't open it (403 / stripped
// file/video/chapters), while a pro student and staff pass through. Also checks
// the Studio create + one-click toggle persist the flag.
// Run: node tests/premiumGating.test.js
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
const Test = require("../src/models/testModel");
const Question = require("../src/models/questionModel");
const Note = require("../src/models/noteModel");
const Video = require("../src/models/videoModel");
const Syllabus = require("../src/models/syllabusModel");
const generateToken = require("../src/utils/generateToken");
const { isPremiumUser } = require("../src/config/roles");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({ name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001", role: "superadmin", isVerified: true, authProvider: "local" });
    const free = await User.create({ name: "Free", email: "f@t.com", password: "secret123", phone: "9000000002", role: "student", plan: "free", isVerified: true, authProvider: "local" });
    const pro = await User.create({ name: "Pro", email: "p@t.com", password: "secret123", phone: "9000000003", role: "student", plan: "pro", isVerified: true, authProvider: "local" });
    const adminT = generateToken(admin._id);
    const freeT = generateToken(free._id);
    const proT = generateToken(pro._id);

    // --- helper: the shared server-side gate ---
    assert.strictEqual(isPremiumUser(admin), true, "staff pass");
    assert.strictEqual(isPremiumUser(pro), true, "pro pass");
    assert.strictEqual(isPremiumUser(free), false, "free blocked");
    assert.strictEqual(isPremiumUser(null), false, "no user blocked");
    ok("isPremiumUser: staff & pro pass, free & anonymous are blocked");

    // ---------- TEST ----------
    const q = await Question.create({ text: "Q1", options: ["A", "B"], correctIndex: 0, createdBy: admin._id });
    const premiumTest = await Test.create({ title: "Premium Mock", mode: "test", durationMinutes: 30, questions: [q._id], totalMarks: 1, status: "published", isPublished: true, premium: true, targets: [], createdBy: admin._id });

    const freeList = (await request.get("/api/tests").set(...auth(freeT))).body.tests;
    const row = freeList.find((t) => String(t._id) === String(premiumTest._id));
    assert.ok(row && row.premium === true && row.locked === true, "free student sees the premium test, locked");
    const proRow = (await request.get("/api/tests").set(...auth(proT))).body.tests.find((t) => String(t._id) === String(premiumTest._id));
    assert.ok(proRow && proRow.premium === true && proRow.locked === false, "pro student sees it unlocked");
    ok("premium test is listed to everyone, but `locked` only for a free student");

    const freeOpen = await request.get(`/api/tests/${premiumTest._id}`).set(...auth(freeT));
    assert.strictEqual(freeOpen.status, 403, "free can't open premium test");
    assert.strictEqual(freeOpen.body.code, "PREMIUM_REQUIRED", "gives the machine code");
    assert.strictEqual((await request.get(`/api/tests/${premiumTest._id}`).set(...auth(proT))).status, 200, "pro can open it");
    assert.strictEqual((await request.get(`/api/tests/${premiumTest._id}`).set(...auth(adminT))).status, 200, "staff can open it");
    const freeSubmit = await request.post(`/api/tests/${premiumTest._id}/submit`).set(...auth(freeT)).send({ answers: [] });
    assert.strictEqual(freeSubmit.status, 403, "free can't submit a premium test either");
    ok("opening/submitting a premium test is 403 PREMIUM_REQUIRED for free, allowed for pro/staff");

    // Studio: create premium + one-click toggle.
    const created = await request.post("/api/studio/tests").set(...auth(adminT)).send({ title: "S", premium: true, questions: [{ text: "Q", options: ["A", "B"], correctIndex: 0 }] });
    assert.strictEqual(created.body.test.premium, true, "studio create stores premium");
    const toggled = await request.patch(`/api/studio/tests/${created.body.test._id}`).set(...auth(adminT)).send({ premium: false });
    assert.strictEqual(toggled.body.test.premium, false, "one-click toggle flips it back to free");
    ok("Studio create + PATCH toggle persist the premium flag");

    // ---------- NOTE ----------
    await Note.create({ title: "Premium Note", category: "notes", fileUrl: "https://x/p.pdf", premium: true, targets: [], uploadedBy: admin._id });
    const noteFree = (await request.get("/api/notes").set(...auth(freeT))).body.notes[0];
    assert.ok(noteFree.premium === true && noteFree.locked === true && !noteFree.fileUrl, "free: note locked & fileUrl withheld");
    const notePro = (await request.get("/api/notes").set(...auth(proT))).body.notes[0];
    assert.ok(notePro.fileUrl && notePro.locked === false, "pro: fileUrl present, not locked");
    const noteId = notePro._id;
    assert.strictEqual((await request.get(`/api/notes/${noteId}`).set(...auth(freeT))).body.code, "PREMIUM_REQUIRED", "free 403 on note detail");
    assert.strictEqual((await request.get(`/api/notes/${noteId}`).set(...auth(proT))).status, 200, "pro opens note");
    const notePatch = await request.patch(`/api/notes/${noteId}`).set(...auth(adminT)).send({ premium: false });
    assert.strictEqual(notePatch.body.note.premium, false, "note PATCH toggle flips to free");
    ok("premium note: listed but fileUrl withheld & detail 403 for free; toggle works");

    // ---------- VIDEO ----------
    await Video.create({ title: "Premium Video", youtubeId: "abcdefghijk", published: true, premium: true, targets: [], createdBy: admin._id });
    const vidFree = (await request.get("/api/videos").set(...auth(freeT))).body.videos.find((v) => v.title === "Premium Video");
    assert.ok(vidFree.premium === true && vidFree.locked === true && !vidFree.youtubeId, "free: video locked & youtubeId withheld");
    const vidPro = (await request.get("/api/videos").set(...auth(proT))).body.videos.find((v) => v.title === "Premium Video");
    assert.ok(vidPro.youtubeId === "abcdefghijk" && vidPro.locked === false, "pro: youtubeId present");
    ok("premium video: listed but the playable youtubeId is withheld from a free student");

    // ---------- SYLLABUS ----------
    await Syllabus.create({ title: "Premium Syllabus", subject: "Maths", chapters: [{ title: "Ch1", topics: [{ title: "T1", estimatedHours: 2 }] }], scope: "global", published: true, premium: true, targets: [], createdBy: admin._id });
    const sylFree = (await request.get("/api/syllabus").set(...auth(freeT))).body.syllabi.find((s) => s.title === "Premium Syllabus");
    assert.ok(sylFree.premium === true && sylFree.locked === true, "free: syllabus locked");
    assert.strictEqual((sylFree.chapters || []).length, 0, "free: chapters withheld");
    assert.ok(sylFree.progress && sylFree.progress.totalTopics === 1, "free: still gets the size (1 topic) for the card");
    const sylPro = (await request.get("/api/syllabus").set(...auth(proT))).body.syllabi.find((s) => s.title === "Premium Syllabus");
    assert.strictEqual((sylPro.chapters || []).length, 1, "pro: chapters present");
    const sylId = sylPro._id;
    assert.strictEqual((await request.get(`/api/syllabus/${sylId}`).set(...auth(freeT))).body.code, "PREMIUM_REQUIRED", "free 403 on syllabus detail");
    assert.strictEqual((await request.get(`/api/syllabus/${sylId}`).set(...auth(proT))).status, 200, "pro opens syllabus");
    ok("premium syllabus: listed with size but chapters withheld & detail 403 for free");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} premium-gating checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ PREMIUM GATING TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
