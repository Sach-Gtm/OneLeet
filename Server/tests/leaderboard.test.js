// Integration tests for the competitive leaderboard: finalisation (ranking +
// tie-breaks), permanent Top-3 achievement counters, exactly-once idempotency,
// the topper notification's targeting, the frozen→published per-test board API,
// and exclusion of in-progress competitive tests from the weekly board.
// Run: node tests/leaderboard.test.js
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
delete process.env.EMAIL_USER;
delete process.env.EMAIL_PASS;
delete process.env.BREVO_API_KEY;

const app = require("../app");
const request = require("supertest")(app);
const User = require("../src/models/userModel");
const Test = require("../src/models/testModel");
const Attempt = require("../src/models/attemptModel");
const Notification = require("../src/models/notificationModel");
const generateToken = require("../src/utils/generateToken");
const svc = require("../src/services/leaderboard/leaderboardService");

let passed = 0;
const ok = (l) => {
    console.log("  ✓ " + l);
    passed++;
};
const auth = (t) => ["Authorization", `Bearer ${t}`];
const MIN = 60 * 1000;

// Create a verified student directly (bypasses registration rate-limiting/OTP)
// and hand back a valid bearer token — exactly what the app would issue.
async function makeStudent(name, email) {
    const user = await User.create({
        name, email, password: "secret123", phone: "9000000000",
        role: "student", isVerified: true, authProvider: "local",
    });
    return { token: generateToken(user._id), id: user._id };
}

(async () => {
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const A = await makeStudent("Alice", "a@test.com");
    const B = await makeStudent("Bob", "b@test.com");
    const C = await makeStudent("Cara", "c@test.com");

    // A competitive test whose window closed 10 min ago → past the 5-min cool-off,
    // so it is DUE for finalisation.
    const closed = new Date(Date.now() - 10 * MIN);
    const test = await Test.create({
        title: "Mock Test 12", mode: "test", durationMinutes: 30,
        closeAt: closed, isPublished: true, status: "published", totalMarks: 10,
    });

    // Attempts: Alice 10/dur120, Bob 10/dur80 (same score, faster → should win),
    // Cara 8. Expected order: Bob(1), Alice(2), Cara(3).
    const now = new Date();
    await Attempt.create({ user: A.id, test: test._id, score: 10, totalMarks: 10, accuracy: 100, durationTakenSeconds: 120, submittedAt: now });
    await Attempt.create({ user: B.id, test: test._id, score: 10, totalMarks: 10, accuracy: 100, durationTakenSeconds: 80, submittedAt: now });
    await Attempt.create({ user: C.id, test: test._id, score: 8, totalMarks: 10, accuracy: 80, durationTakenSeconds: 90, submittedAt: now });
    // A second, weaker Alice attempt — must be ignored (best-attempt-per-user).
    await Attempt.create({ user: A.id, test: test._id, score: 4, totalMarks: 10, accuracy: 40, durationTakenSeconds: 60, submittedAt: now });

    // ---- finalisation ----
    const r1 = await svc.finalizeTestLeaderboard(test._id);
    assert.strictEqual(r1.finalized, true);
    assert.strictEqual(r1.ranked, 3, "3 distinct users ranked (Alice's two attempts collapse to one)");
    ok("finalize ranks each user's best attempt once");

    const bobBest = await Attempt.findOne({ user: B.id, test: test._id, rank: { $ne: null } });
    const aliceBest = await Attempt.findOne({ user: A.id, test: test._id, rank: { $ne: null } });
    const caraBest = await Attempt.findOne({ user: C.id, test: test._id, rank: { $ne: null } });
    assert.strictEqual(bobBest.rank, 1, "tie broken by faster time → Bob rank 1");
    assert.strictEqual(aliceBest.rank, 2);
    assert.strictEqual(caraBest.rank, 3);
    assert.strictEqual(aliceBest.score, 10, "Alice's ranked attempt is her BEST (10), not her weaker one");
    ok("tie-break (score, then time) ranks Bob #1 over Alice");

    let bob = await User.findById(B.id);
    let alice = await User.findById(A.id);
    let cara = await User.findById(C.id);
    assert.strictEqual(bob.achievements.rank1, 1);
    assert.strictEqual(alice.achievements.rank2, 1);
    assert.strictEqual(cara.achievements.rank3, 1);
    ok("Top-3 achievement counters incremented");

    // Topper notification: targeted to all 3 participants, names the champion.
    const notif = await Notification.findOne({ test: test._id, type: "leaderboard" });
    assert.ok(notif, "leaderboard notification created");
    assert.strictEqual(notif.recipients.length, 3, "targeted to all participants");
    assert.ok(/Bob/.test(notif.body), "champion named in the notification");
    ok("topper notification is targeted to participants and names the champion");

    // ---- idempotency ----
    const r2 = await svc.finalizeTestLeaderboard(test._id);
    assert.strictEqual(r2.finalized, false, "already-published test is not re-finalised");
    bob = await User.findById(B.id);
    assert.strictEqual(bob.achievements.rank1, 1, "counters NOT double-incremented");
    const notifCount = await Notification.countDocuments({ test: test._id });
    assert.strictEqual(notifCount, 1, "no duplicate notification");
    ok("finalisation is idempotent (exactly once)");

    // ---- published per-test board API ----
    const pub = await request.get(`/api/leaderboard/test/${test._id}`).set(...auth(B.token));
    assert.strictEqual(pub.status, 200);
    assert.strictEqual(pub.body.status, "published");
    assert.strictEqual(pub.body.leaderboard[0].name, "Bob");
    assert.strictEqual(pub.body.me.rank, 1);
    assert.strictEqual(pub.body.me.isTop3, true);
    assert.strictEqual(pub.body.me.timesAtRank, 1, "'your Nth time' count surfaced");
    ok("published board API returns ranked list + caller's rank");

    // ---- frozen (pending) board API ----
    const openTest = await Test.create({
        title: "Live Mock", mode: "test", durationMinutes: 30,
        closeAt: new Date(Date.now() + 60 * MIN), isPublished: true, status: "published",
    });
    await Attempt.create({ user: A.id, test: openTest._id, score: 7, totalMarks: 10, accuracy: 70, durationTakenSeconds: 100, submittedAt: now });
    await Attempt.create({ user: B.id, test: openTest._id, score: 9, totalMarks: 10, accuracy: 90, durationTakenSeconds: 100, submittedAt: now });
    const pend = await request.get(`/api/leaderboard/test/${openTest._id}`).set(...auth(A.token));
    assert.strictEqual(pend.body.status, "pending", "board frozen while test is open");
    assert.ok(!pend.body.leaderboard, "no standings leaked while frozen");
    assert.strictEqual(pend.body.me.attempted, true);
    assert.strictEqual(pend.body.me.score, 7, "caller sees only their own score");
    assert.ok(pend.body.revealAt, "reveal time provided for the countdown");
    ok("frozen board hides standings and only shows a countdown + own score");

    // ---- weekly board excludes the in-progress competitive test ----
    // Alice also has a normal (windowless) attempt that SHOULD count.
    const normal = await Test.create({ title: "Practice-ish", mode: "test", isPublished: true, durationMinutes: 20 });
    await Attempt.create({ user: A.id, test: normal._id, score: 5, totalMarks: 10, accuracy: 50, durationTakenSeconds: 100, submittedAt: now });
    const weekly = await request.get("/api/leaderboard").set(...auth(A.token));
    assert.strictEqual(weekly.status, 200);
    // The weekly board sums ALL of a user's attempts (unchanged behaviour). For
    // Alice that's the published test's two attempts (10 + 4) + the normal test
    // (5) = 19 — and it must EXCLUDE the still-open competitive test (7), so it is
    // never 26.
    assert.strictEqual(weekly.body.me.totalScore, 19, "open competitive test excluded from weekly board");
    ok("weekly board excludes in-progress competitive tests, includes published ones");

    // ---- Hall of Fame ----
    const hof = await request.get("/api/leaderboard/hall-of-fame").set(...auth(B.token));
    assert.strictEqual(hof.status, 200);
    assert.strictEqual(hof.body.hallOfFame[0].name, "Bob");
    assert.strictEqual(hof.body.hallOfFame[0].timesRank1, 1);
    assert.ok(hof.body.hallOfFame.every((h) => h.timesRank1 >= 1), "only Rank-#1 holders listed");
    ok("Hall of Fame lists Rank-#1 holders by count");

    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n✅ All ${passed} leaderboard checks passed`);
    process.exit(0);
})().catch(async (e) => {
    console.error("\n❌ LEADERBOARD TEST FAILED:", e.message);
    console.error(e.stack);
    process.exit(1);
});
