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
        title: "DTU only", url: "https://youtu.be/bbbbbbbbbbb", targets: ["dtu-leet"],
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

    // Staff edits a video.
    const upd = await request
        .put(`/api/videos/${vidId}`)
        .set(...auth(teacherToken))
        .send({ title: "Set Theory — Updated" });
    assert.strictEqual(upd.status, 200);
    assert.strictEqual(upd.body.video.title, "Set Theory — Updated", "title updated");
    ok("staff can edit a video");

    // A student can't delete.
    const delForbid = await request.delete(`/api/videos/${vidId}`).set(...auth(studentToken));
    assert.strictEqual(delForbid.status, 403, "student cannot delete");
    // Staff can.
    const del = await request.delete(`/api/videos/${vidId}`).set(...auth(teacherToken));
    assert.strictEqual(del.status, 200, "staff can delete");
    const afterDel = (await request.get("/api/videos").set(...auth(teacherToken))).body.videos;
    assert.strictEqual(afterDel.length, 3, "one fewer video after delete");
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
