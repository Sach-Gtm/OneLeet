// Tests for landing-page reviews: PUBLIC read (no auth), ADMIN-only add/delete,
// text reviews + validation. Video reviews upload a clip to Cloudinary, which
// needs live credentials, so here we only assert a video review without a file
// is rejected — the happy-path upload is covered manually.
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
    assert.strictEqual(addText.body.review.video, null, "text review has no video");
    ok("an admin adds a text review");

    // A text review needs text; a video review needs an uploaded clip.
    const noText = await request.post("/api/reviews").set(...auth(adminToken)).send({ type: "text" });
    assert.strictEqual(noText.status, 400, "empty text review is rejected");
    const noFile = await request.post("/api/reviews").set(...auth(adminToken)).send({ type: "video", title: "x" });
    assert.strictEqual(noFile.status, 400, "video review without a file is rejected");
    ok("validation: text needs a message, a video review needs an uploaded clip");

    // Public list shows the text review, safe fields only (no createdBy).
    const pub = await request.get("/api/reviews");
    assert.strictEqual(pub.body.reviews.length, 1, "review is public");
    assert.ok(!("createdBy" in pub.body.reviews[0]), "internal fields not exposed");
    assert.ok("video" in pub.body.reviews[0], "video field present in the shape");
    ok("published reviews appear on the public endpoint with safe fields only");

    // Admin deletes it.
    const del = await request.delete(`/api/reviews/${addText.body.review._id}`).set(...auth(adminToken));
    assert.strictEqual(del.status, 200, "admin deletes a review");
    assert.strictEqual((await request.get("/api/reviews")).body.reviews.length, 0, "none left after delete");
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
