// Tests for the AI cost-optimization layer: per-plan daily quotas, response cache
// (a cache hit is free and bypasses the quota), staff/premium exemptions, usage
// logging and the admin spend summary. Uses the offline stub provider — no key,
// no real AI calls. Run: node tests/aiCost.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.AI_PROVIDER; // → stub provider
delete process.env.GEMINI_API_KEY;
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const AiUsage = require("../src/models/aiUsageModel");
const generateToken = require("../src/utils/generateToken");
const runtime = require("../src/services/ai/aiRuntime");
const { DAILY_LIMITS } = require("../src/config/aiLimits");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];

async function makeUser(name, email, { plan = "free", role = "student" } = {}) {
    const u = await User.create({
        name, email, password: "secret123", phone: "9000000000", role, plan,
        isVerified: true, authProvider: "local",
    });
    return { id: u._id, doc: u, token: generateToken(u._id) };
}

const gen = (token, topic) =>
    request.post("/api/ai/questions").set(...auth(token)).send({ subject: "Physics", topic, count: 3 });

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const free = await makeUser("Free", "free@test.com", { plan: "free" });
    const pro = await makeUser("Pro", "pro@test.com", { plan: "pro" });
    const mentor = await makeUser("Mentor", "mentor@test.com", { role: "teacher" });

    // ---- free plan: exactly DAILY_LIMITS.free billable generations, then 429 ----
    assert.strictEqual(DAILY_LIMITS.free, 5, "test assumes free limit of 5");
    for (let i = 1; i <= 5; i++) {
        const r = await gen(free.token, `free-topic-${i}`);
        assert.strictEqual(r.status, 200, `free gen ${i} should succeed`);
        assert.strictEqual(r.body.cached, false, "distinct topic is a fresh generation");
    }
    ok("free student gets exactly 5 fresh AI generations");

    const blocked = await gen(free.token, "free-topic-6");
    assert.strictEqual(blocked.status, 429, "6th distinct generation is blocked");
    assert.ok(/premium/i.test(blocked.body.message), "429 nudges toward premium");
    assert.strictEqual(blocked.body.quota.remaining, 0);
    ok("free student is blocked (429) after the daily limit, with an upgrade nudge");

    // ---- a CACHED repeat is free and bypasses the exhausted quota ----
    const cachedHit = await gen(free.token, "free-topic-1"); // same as an earlier request
    assert.strictEqual(cachedHit.status, 200, "cached repeat succeeds even when out of quota");
    assert.strictEqual(cachedHit.body.cached, true, "served from cache");
    ok("a cached/repeat request is free and works even after the limit is hit");

    // ...but a NEW distinct request is still blocked.
    const stillBlocked = await gen(free.token, "free-topic-7");
    assert.strictEqual(stillBlocked.status, 429);
    ok("cache hits don't unlock new fresh generations");

    // ---- quota endpoint reflects reality ----
    const q = await request.get("/api/ai/quota").set(...auth(free.token));
    assert.strictEqual(q.body.quota.limit, 5);
    assert.strictEqual(q.body.quota.used, 5);
    assert.strictEqual(q.body.quota.remaining, 0);
    ok("GET /ai/quota reports used/remaining for the meter");

    // ---- premium student: far higher ceiling (not blocked at 5) ----
    for (let i = 1; i <= 7; i++) {
        const r = await gen(pro.token, `pro-topic-${i}`);
        assert.strictEqual(r.status, 200, `pro gen ${i} should succeed`);
    }
    const proQuota = await runtime.quotaFor(pro.doc);
    assert.strictEqual(proQuota.limit, DAILY_LIMITS.pro);
    assert.strictEqual(proQuota.used, 7);
    ok("premium student has the 100/day ceiling (sails past 5)");

    // ---- staff: unlimited ----
    for (let i = 1; i <= 8; i++) {
        const r = await gen(mentor.token, `mentor-topic-${i}`);
        assert.strictEqual(r.status, 200, `mentor gen ${i} should succeed`);
    }
    const mentorQuota = await runtime.quotaFor(mentor.doc);
    assert.strictEqual(mentorQuota.unlimited, true);
    ok("staff (mentor) are unlimited");

    // ---- usage logging: free student has 5 billable + ≥1 cache-hit row ----
    const freeBillable = await AiUsage.countDocuments({ user: free.id, cacheHit: false });
    const freeCached = await AiUsage.countDocuments({ user: free.id, cacheHit: true });
    assert.strictEqual(freeBillable, 5, "5 billable rows logged (blocked attempts don't log)");
    assert.ok(freeCached >= 1, "cache hit logged");
    ok("token/usage logging records billable vs cached per user");

    // ---- admin spend summary aggregates ----
    const summary = await runtime.usageSummary();
    assert.ok(summary.today.calls >= 20, "today's calls aggregated");
    assert.ok(summary.today.cached >= 1, "cache hits counted");
    assert.ok(summary.byFeature.some((f) => f.feature === "questions"), "per-feature breakdown present");
    assert.ok(summary.topUsers.length >= 1, "heaviest users surfaced");
    assert.ok(typeof summary.month.cacheHitRate === "number");
    ok("admin usage summary aggregates calls, cache-hit rate, cost and top users");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} AI-cost checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ AI-COST TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
