// Integration tests for the mandatory passport-photo upload. Run with:
//   node tests/passport.test.js
// Uses an in-memory MongoDB and stubs Cloudinary (no network / no real upload)
// so the endpoint's behaviour — auth gate, 1 MB limit, image-only filter,
// avatar mirroring, and old-asset cleanup on replace — is exercised in full.
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Stub Cloudinary before any request runs. The config module exports the shared
// v2 instance, so patching its uploader here is what the controller sees.
const cloudinary = require("../src/config/cloudinary");
let destroyed = [];
cloudinary.uploader.upload_stream = (options, cb) => ({
    end: () =>
        process.nextTick(() =>
            cb(null, {
                secure_url: "https://res.cloudinary.com/test/passport.jpg",
                public_id: "oneleet/passport-photos/abc123",
            })
        ),
});
cloudinary.uploader.destroy = async (id) => {
    destroyed.push(id);
    return { result: "ok" };
};

const app = require("../app");
const request = require("supertest");
const User = require("../src/models/userModel");
const generateToken = require("../src/utils/generateToken");

let passed = 0;
const ok = (label) => {
    console.log("  ✓ " + label);
    passed++;
};

const PNG = { filename: "p.png", contentType: "image/png" };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const agent = request(app);

    // ---- Auth gate
    const noAuth = await agent
        .post("/api/auth/me/passport-photo")
        .attach("photo", Buffer.from("x".repeat(100)), PNG);
    assert.strictEqual(noAuth.status, 401, "must require auth");
    ok("rejects unauthenticated upload (401)");

    const user = await User.create({
        name: "Pixel",
        email: "pixel@test.com",
        password: "secret123",
        phone: "9000000000",
    });
    const token = generateToken(user._id);
    const auth = (r) => r.set("Authorization", "Bearer " + token);

    // ---- Happy path: passportPhoto set + avatar mirrored
    const good = await auth(
        agent
            .post("/api/auth/me/passport-photo")
            .attach("photo", Buffer.from("x".repeat(1000)), PNG)
    );
    assert.strictEqual(good.status, 200, "valid upload should 200");
    assert.ok(good.body.user.passportPhoto && good.body.user.passportPhoto.url, "passportPhoto.url set");
    assert.strictEqual(
        good.body.user.avatar,
        good.body.user.passportPhoto.url,
        "avatar mirrors the passport photo URL"
    );
    ok("valid image sets passportPhoto and mirrors avatar");

    // ---- Replace deletes the previous Cloudinary asset
    destroyed = [];
    const replace = await auth(
        agent
            .post("/api/auth/me/passport-photo")
            .attach("photo", Buffer.from("y".repeat(1000)), PNG)
    );
    assert.strictEqual(replace.status, 200);
    assert.deepStrictEqual(
        destroyed,
        ["oneleet/passport-photos/abc123"],
        "old asset should be destroyed on replace"
    );
    ok("replacing a photo deletes the previous asset");

    // ---- Non-image rejected
    const notImage = await auth(
        agent
            .post("/api/auth/me/passport-photo")
            .attach("photo", Buffer.from("%PDF-1.4"), {
                filename: "p.pdf",
                contentType: "application/pdf",
            })
    );
    assert.strictEqual(notImage.status, 400, "non-image should 400");
    ok("rejects non-image files (400)");

    // ---- Over 1 MB rejected with a friendly message
    const big = Buffer.alloc(1024 * 1024 + 50 * 1024, 1); // ~1.05 MB
    const tooBig = await auth(
        agent.post("/api/auth/me/passport-photo").attach("photo", big, PNG)
    );
    assert.strictEqual(tooBig.status, 400, "over-1MB should 400");
    assert.match(tooBig.body.message, /1 MB/i, "message should mention the 1 MB limit");
    ok("rejects photos larger than 1 MB (400)");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} passport-photo checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
