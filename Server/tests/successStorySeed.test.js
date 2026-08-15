// Tests the one-time success-story seed: it attaches the founder's story to a
// student's existing photo record (keeping the photo), is idempotent, and can
// create the record when none exists. Run: node tests/successStorySeed.test.js
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
const Review = require("../src/models/reviewModel");
const SeedFlag = require("../src/models/seedFlagModel");
const { ensureSuccessStoriesSeeded } = require("../src/config/seedSuccessStories");

const SLUG = "keshav-kumar-jha-ipu-leet-mait";
let passed = 0;
const ok = (l) => { console.log("  ✓ " + l); passed++; };

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const admin = await User.create({
        name: "Admin", email: "a@t.com", password: "secret123", phone: "9000000001",
        role: "admin", isVerified: true, authProvider: "local",
    });

    // The founder's already-uploaded photo record (name jammed with college, no case yet).
    await Review.create({
        type: "image",
        image: { url: "https://cdn.example/keshav.jpg", publicId: "oneleet/reviews/keshav" },
        author: "Keshav Kumar Jha / MAIT CST",
        createdBy: admin._id,
    });

    // Seed → attaches the full story to that record, keeping the photo.
    await ensureSuccessStoriesSeeded();
    const cases = (await request.get("/api/reviews/cases")).body.cases;
    const k = cases.find((c) => c.slug === SLUG);
    assert.ok(k, "Keshav's case is published");
    assert.strictEqual(k.author, "Keshav Kumar Jha", "name normalised");
    assert.strictEqual(k.rank, "AIR 65", "rank set");
    assert.strictEqual(k.college, "MAIT", "college set");
    assert.strictEqual(k.branch, "CSE", "branch set");
    assert.strictEqual(k.image, "https://cdn.example/keshav.jpg", "his real photo is kept");
    const full = (await request.get(`/api/reviews/cases/${SLUG}`)).body.case;
    assert.ok(/rank 65/i.test(full.caseStory) && full.caseStory.length > 400, "full story is attached");
    assert.ok(/mait|maharaja agrasen/i.test(full.caseStory), "story mentions the college (SEO)");
    ok("attaches the story to the existing photo record and keeps the photo");

    // The other founder stories seed too (create path — no photos uploaded for them).
    const NEW_SLUGS = [
        "roshan-leet-counselling-mait-cse",
        "kaif-ipu-leet-mait-cse",
        "rohit-leet-counselling-mait",
        "aditya-shahi-ipu-leet-mait",
    ];
    for (const slug of NEW_SLUGS) {
        const full2 = (await request.get(`/api/reviews/cases/${slug}`)).body.case;
        assert.ok(full2 && full2.isCase === true, `${slug} is published as a case`);
        assert.ok(full2.caseStory && full2.caseStory.length > 300, `${slug} has a full story`);
        assert.ok(/mait|maharaja agrasen/i.test(full2.caseStory), `${slug} story mentions the college (SEO)`);
        assert.ok(full2.text && full2.text.length > 150 && full2.text.length <= 600, `${slug} has a written review quote within the length cap`);
    }
    assert.strictEqual((await request.get("/api/reviews/cases")).body.cases.length, 5, "all five stories published");
    ok("seeds the four additional founder stories");

    // Idempotent — running again doesn't duplicate or overwrite.
    await ensureSuccessStoriesSeeded();
    assert.strictEqual(await Review.countDocuments({ slug: SLUG }), 1, "no duplicate");
    ok("re-running the seed is a no-op");

    // Create path — no photo record + fresh flag → it creates the case.
    await Review.deleteMany({});
    await SeedFlag.deleteMany({});
    await ensureSuccessStoriesSeeded();
    const created = await Review.findOne({ slug: SLUG });
    assert.ok(created && created.isCase === true, "creates the case when no record exists");
    assert.ok(!(created.image && created.image.url), "no photo → initials fallback");
    ok("creates the story when no photo record exists");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} success-story seed checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ SUCCESS-STORY SEED TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
