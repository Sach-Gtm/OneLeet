// Tests for landing-page reviews: PUBLIC read (no auth), ADMIN-only add/delete,
// text + video shapes, and YouTube-id parsing for video reviews.
// Run: node tests/reviews.test.js
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

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

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

    // Public read works with no auth and starts empty (no dummy data).
    const pub0 = await request.get("/api/reviews");
    assert.strictEqual(pub0.status, 200, "public GET works without auth");
    assert.strictEqual(pub0.body.reviews.length, 0, "no reviews seeded");
    ok("reviews are public to read and start empty (no dummy data)");

    // Neither a student nor a mentor can add — admin only.
    const sForbid = await request.post("/api/reviews").set(...auth(studentToken)).send({ type: "text", text: "hi" });
    assert.strictEqual(sForbid.status, 403, "student cannot add");
    const tForbid = await request.post("/api/reviews").set(...auth(teacherToken)).send({ type: "text", text: "hi" });
    assert.strictEqual(tForbid.status, 403, "mentor cannot add");
    ok("only admins can add reviews (students and mentors get 403)");

    // Admin adds a text review.
    const addText = await request
        .post("/api/reviews")
        .set(...auth(adminToken))
        .send({ type: "text", text: "OneLeet got me into DTU!", author: "Rahul, Diploma CS" });
    assert.strictEqual(addText.status, 201, "admin adds a text review");
    assert.strictEqual(addText.body.review.type, "text");

    // Admin adds a video review — id parsed from the URL.
    const addVideo = await request
        .post("/api/reviews")
        .set(...auth(adminToken))
        .send({ type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "My LEET journey" });
    assert.strictEqual(addVideo.status, 201, "admin adds a video review");
    assert.strictEqual(addVideo.body.review.youtubeId, "dQw4w9WgXcQ", "video id parsed from URL");
    const videoId = addVideo.body.review._id;
    ok("an admin adds text and video reviews (video id parsed from the link)");

    // A video review needs a title, and a valid link.
    const noTitle = await request
        .post("/api/reviews").set(...auth(adminToken))
        .send({ type: "video", url: "https://youtu.be/dQw4w9WgXcQ" });
    assert.strictEqual(noTitle.status, 400, "video without a title is rejected");
    const badLink = await request
        .post("/api/reviews").set(...auth(adminToken))
        .send({ type: "video", url: "nope", title: "x" });
    assert.strictEqual(badLink.status, 400, "video with a bad link is rejected");
    // A text review needs text.
    const noText = await request.post("/api/reviews").set(...auth(adminToken)).send({ type: "text" });
    assert.strictEqual(noText.status, 400, "empty text review is rejected");
    ok("validation: video needs title+valid link, text needs a message");

    // Public list now shows both, safe fields only (no createdBy).
    const pub = await request.get("/api/reviews");
    assert.strictEqual(pub.body.reviews.length, 2, "both reviews are public");
    assert.ok(!("createdBy" in pub.body.reviews[0]), "internal fields not exposed");
    ok("published reviews appear on the public endpoint with safe fields only");

    // Admin deletes one.
    const del = await request.delete(`/api/reviews/${videoId}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin deletes a review");
    const pub2 = await request.get("/api/reviews");
    assert.strictEqual(pub2.body.reviews.length, 1, "one review left after delete");
    ok("an admin can delete a review");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} review checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ REVIEWS TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
