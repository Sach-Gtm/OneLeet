// Tests for the video library: staff (mentor/admin) manage videos; students can
// only watch. YouTube ids are parsed from pasted URLs, and students see only
// published videos targeted at the universities they picked.
// Run: node tests/videos.test.js
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
const { parseYouTubeId } = require("../src/utils/youtube");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    // --- Pure unit: the YouTube id parser handles the common link shapes. ---
    assert.strictEqual(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.strictEqual(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.strictEqual(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0"), "dQw4w9WgXcQ");
    assert.strictEqual(parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.strictEqual(parseYouTubeId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
    assert.strictEqual(parseYouTubeId("https://example.com/not-a-video"), "");
    ok("parseYouTubeId extracts the id from every common YouTube link shape");

    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await ensureExamsSeeded();

    const teacher = await User.create({
        name: "Mentor", email: "m@t.com", password: "secret123", phone: "9000000001",
        role: "teacher", isVerified: true, authProvider: "local",
    });
    // A student preparing for IPU LEET only.
    const student = await User.create({
        name: "S", email: "s@t.com", password: "secret123", phone: "9000000002",
        role: "student", isVerified: true, authProvider: "local", exams: ["ipu-leet"],
    });
    const teacherToken = generateToken(teacher._id);
    const studentToken = generateToken(student._id);

    // A student cannot add a video.
    const forbid = await request
        .post("/api/videos")
        .set(...auth(studentToken))
        .send({ title: "X", url: "https://youtu.be/dQw4w9WgXcQ", targets: ["all"] });
    assert.strictEqual(forbid.status, 403, "student cannot add a video");
    ok("students can't manage videos (staff only)");

    // Staff adds a video from a full watch URL — the id is parsed out.
    const add = await request
        .post("/api/videos")
        .set(...auth(teacherToken))
        .send({
            title: "Set Theory — Complete Concept",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
            subject: "Discrete Mathematics",
            chapter: "Unit 1 — Set Theory",
            targets: ["all"],
        });
    assert.strictEqual(add.status, 201, "staff can add a video");
    assert.strictEqual(add.body.video.youtubeId, "dQw4w9WgXcQ", "id parsed from the URL");
    const vidId = add.body.video._id;
    ok("staff adds a video and the YouTube id is parsed from the pasted URL");

    // A bad link is rejected.
    const bad = await request
        .post("/api/videos")
        .set(...auth(teacherToken))
        .send({ title: "Bad", url: "just some text", targets: ["all"] });
    assert.strictEqual(bad.status, 400, "invalid link rejected");
    ok("a non-YouTube link is rejected with 400");

    // Targeted + draft videos to exercise student visibility.
    await request.post("/api/videos").set(...auth(teacherToken)).send({
        title: "IPU only", url: "https://youtu.be/aaaaaaaaaaa", targets: ["ipu-leet"],
    });
    await request.post("/api/videos").set(...auth(teacherToken)).send({
        title: "DTU only", url: "https://youtu.be/bbbbbbbbbbb", targets: ["dtu-nsut-leet"],
    });
    await request.post("/api/videos").set(...auth(teacherToken)).send({
        title: "Hidden draft", url: "https://youtu.be/ccccccccccc", targets: ["all"], published: false,
    });

    // Staff sees everything (incl. the DTU-only + the draft): 4 total.
    const staffList = (await request.get("/api/videos").set(...auth(teacherToken))).body.videos;
    assert.strictEqual(staffList.length, 4, "staff sees all four videos");
    ok("staff sees every video, including drafts and other-university ones");

    // The IPU student sees only: "all" published + "ipu-leet" published (2), not
    // the DTU-only one and not the draft.
    const studentList = (await request.get("/api/videos").set(...auth(studentToken))).body.videos;
    const titles = studentList.map((v) => v.title).sort();
    assert.deepStrictEqual(
        titles,
        ["IPU only", "Set Theory — Complete Concept"],
        "student sees only published videos targeted at their university"
    );
    ok("a student sees only published videos for the universities they picked");

    // --- Bulk add: many links under ONE subject; invalid links are skipped. ---
    const studentBulk = await request
        .post("/api/videos/bulk")
        .set(...auth(studentToken))
        .send({ subject: "Reasoning", targets: ["all"], items: [{ url: "https://youtu.be/ddddddddddd" }] });
    assert.strictEqual(studentBulk.status, 403, "student cannot bulk-add");

    const bulk = await request
        .post("/api/videos/bulk")
        .set(...auth(teacherToken))
        .send({
            subject: "Reasoning",
            targets: ["ipu-leet"],
            items: [
                { url: "https://youtu.be/ddddddddddd", chapter: "Analogy" },
                { url: "https://www.youtube.com/watch?v=eeeeeeeeeee", chapter: "Classification", topic: "Odd one out" },
                { url: "not a youtube link", chapter: "Bad" },
            ],
        });
    assert.strictEqual(bulk.status, 201, "staff can bulk-add");
    assert.strictEqual(bulk.body.createdCount, 2, "two valid links created");
    assert.strictEqual(bulk.body.failed.length, 1, "one invalid link reported back");
    assert.ok(bulk.body.videos.every((v) => v.subject === "Reasoning"), "all created under the one subject");
    const analogy = bulk.body.videos.find((v) => v.chapter === "Analogy");
    assert.strictEqual(analogy.title, "Analogy", "a titleless link falls back to its chapter name");
    ok("staff bulk-adds many links under one subject; invalid links are skipped and reported");

    // Staff edits a video.
    const upd = await request
        .put(`/api/videos/${vidId}`)
        .set(...auth(teacherToken))
        .send({ title: "Set Theory — Updated" });
    assert.strictEqual(upd.status, 200);
    assert.strictEqual(upd.body.video.title, "Set Theory — Updated", "title updated");
    ok("staff can edit a video");

    // --- Watch progress: save %, auto-complete near the end, reversible toggle ---
    const p1 = await request.post(`/api/videos/${vidId}/progress`).set(...auth(studentToken)).send({ watchedSeconds: 30, durationSeconds: 100 });
    assert.strictEqual(p1.status, 200, "progress accepted");
    assert.strictEqual(p1.body.progress.percent, 30, "saved as 30%");
    assert.strictEqual(p1.body.progress.completed, false, "not complete at 30%");
    const vrow = (await request.get("/api/videos").set(...auth(studentToken))).body.videos.find((v) => String(v._id) === String(vidId));
    assert.strictEqual(vrow.progress.percent, 30, "the list carries the 30% watch progress");

    const p2 = await request.post(`/api/videos/${vidId}/progress`).set(...auth(studentToken)).send({ watchedSeconds: 95, durationSeconds: 100 });
    assert.strictEqual(p2.body.progress.percent, 95, "furthest point kept");
    assert.strictEqual(p2.body.progress.completed, true, "auto-complete at ≥90%");

    const un = await request.post(`/api/videos/${vidId}/complete`).set(...auth(studentToken)).send({ completed: false });
    assert.strictEqual(un.body.progress.completed, false, "completion can be reversed");
    const re = await request.post(`/api/videos/${vidId}/complete`).set(...auth(studentToken)).send({ completed: true });
    assert.strictEqual(re.body.progress.completed, true, "and re-marked complete");
    assert.strictEqual(re.body.progress.percent, 100, "manual complete fills the bar");
    ok("watch progress: saves %, auto-completes ≥90%, manual complete is reversible");

    // A student can't delete.
    const delForbid = await request.delete(`/api/videos/${vidId}`).set(...auth(studentToken));
    assert.strictEqual(delForbid.status, 403, "student cannot delete");
    // Staff can.
    const del = await request.delete(`/api/videos/${vidId}`).set(...auth(teacherToken));
    assert.strictEqual(del.status, 200, "staff can delete");
    const afterDel = (await request.get("/api/videos").set(...auth(teacherToken))).body.videos;
    assert.strictEqual(afterDel.length, 5, "one fewer video after delete (4 singles + 2 bulk − 1)");
    ok("staff can delete a video; students cannot");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} video checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ VIDEOS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
