// Tests for staff note authoring: the AI-draft endpoint and publishing notes
// (written/AI text notes, no PDF required), plus that only staff can do either.
// Uses the offline "stub" AI provider (no GEMINI_API_KEY), so it runs anywhere.
// Run: node tests/notes.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.AI_PROVIDER; // -> stub
delete process.env.GEMINI_API_KEY;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const Note = require("../src/models/noteModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const teacher = await User.create({
        name: "Mentor", email: "mentor@test.com", password: "secret123", phone: "9000000001",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    const student = await User.create({
        name: "Learner", email: "learner@test.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local",
    });
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);

    // A student may NOT AI-draft.
    const stuGen = await request.post("/api/notes/generate").set(...auth(studentToken)).send({ topic: "Ohm's Law" });
    assert.strictEqual(stuGen.status, 403, "student cannot AI-draft");
    ok("students can't reach the AI-draft endpoint");

    // A student may NOT publish.
    const stuPub = await request
        .post("/api/notes")
        .set(...auth(studentToken))
        .send({ title: "x", content: "hello" });
    assert.strictEqual(stuPub.status, 403, "student cannot publish a note");
    ok("students can't publish notes");

    // A mentor CAN AI-draft from a FREEFORM instruction — stub echoes it.
    const gen = await request
        .post("/api/notes/generate")
        .set(...auth(teacherToken))
        .send({ prompt: "Write 5 MCQs on the First Law of Thermodynamics with answers", subject: "Mechanical" });
    assert.strictEqual(gen.status, 200, "mentor can AI-draft");
    assert.ok(gen.body.draft && gen.body.draft.content && gen.body.draft.title, "draft has title + content");
    // Missing both prompt and file → rejected.
    const genEmpty = await request.post("/api/notes/generate").set(...auth(teacherToken)).send({});
    assert.strictEqual(genEmpty.status, 400, "AI needs an instruction or a file");
    ok("a mentor can AI-draft from a freeform instruction (and empty is refused)");

    // A mentor CAN publish a text note (content, no file).
    const draft = gen.body.draft;
    const pub = await request
        .post("/api/notes")
        .set(...auth(teacherToken))
        .send({ title: draft.title, subject: "Mechanical", description: draft.description, content: draft.content, source: "ai" });
    assert.strictEqual(pub.status, 201, "mentor can publish a text note");
    assert.strictEqual(pub.body.note.format, "text", "no-file note is a text note");
    assert.strictEqual(pub.body.note.source, "ai", "AI source recorded");
    assert.ok(pub.body.note.content && pub.body.note.content.length > 20, "content saved");
    ok("a mentor can publish an AI/text note (format=text, source=ai)");

    // Publishing with neither file nor content is rejected.
    const empty = await request
        .post("/api/notes")
        .set(...auth(teacherToken))
        .send({ title: "Empty note" });
    assert.strictEqual(empty.status, 400, "a note needs a file or content");
    ok("publishing with no file and no content is refused");

    // The note is readable by id (full content) and appears in the list.
    const noteId = pub.body.note._id;
    const byId = await request.get(`/api/notes/${noteId}`).set(...auth(studentToken));
    assert.strictEqual(byId.status, 200);
    assert.ok(byId.body.note.content && byId.body.note.content.length > 20, "reader gets full content");
    ok("a published text note is readable by id (with content)");

    const list = await request.get("/api/notes").set(...auth(studentToken));
    assert.strictEqual(list.status, 200);
    assert.ok(list.body.notes.some((n) => String(n._id) === String(noteId)), "note shows in the library");
    ok("the published note appears in the notes library");

    // A manual text note (source defaults to manual).
    const manual = await request
        .post("/api/notes")
        .set(...auth(teacherToken))
        .send({ title: "Hand-typed note", content: "## Heading\n- point one\n- point two" });
    assert.strictEqual(manual.status, 201);
    assert.strictEqual(manual.body.note.source, "manual", "hand-typed note is manual source");
    ok("a hand-typed note publishes with source=manual");

    assert.strictEqual(await Note.countDocuments({ category: "notes" }), 2, "exactly the two notes exist");
    ok("the notes collection holds exactly the published notes");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} note-authoring checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ NOTES TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
