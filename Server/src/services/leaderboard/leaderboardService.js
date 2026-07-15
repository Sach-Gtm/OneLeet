const mongoose = require("mongoose");
const Test = require("../../models/testModel");
const Attempt = require("../../models/attemptModel");
const User = require("../../models/userModel");
const Notification = require("../../models/notificationModel");

// A graded test's ranking is frozen while it runs and for a short cool-off after
// it closes, then finalised exactly once. This is what keeps the board fair —
// nobody sees live standings mid-test, and late/edge submissions are all in
// before ranks are computed.
const REVEAL_DELAY_MS = 5 * 60 * 1000; // 5 minutes after closeAt

// The delayed-leaderboard flow applies ONLY to graded tests that have a close
// time. Practice sets and windowless tests stay instant (handled elsewhere).
function isCompetitive(test) {
    return !!(test && test.mode === "test" && test.closeAt);
}

// When this test's leaderboard becomes eligible to publish (closeAt + 5 min).
function revealAt(test) {
    return test && test.closeAt
        ? new Date(new Date(test.closeAt).getTime() + REVEAL_DELAY_MS)
        : null;
}

// True once the cool-off has elapsed and the board hasn't been finalised yet.
function isDue(test, now = Date.now()) {
    const r = revealAt(test);
    return isCompetitive(test) && !test.leaderboardPublished && !!r && r.getTime() <= now;
}

// Ranking comparator — the "predefined ranking logic":
//   1. higher score wins
//   2. tie → faster completion wins
//   3. still tied → earlier submission wins
//   4. still tied → stable by id
// Returns <0 when a should rank above b.
function compareAttempts(a, b) {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    const da = a.durationTakenSeconds || 0;
    const db = b.durationTakenSeconds || 0;
    if (da !== db) return da - db;
    const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return String(a._id).localeCompare(String(b._id));
}

// Collapse many attempts into one ranked list: each user's BEST attempt only,
// sorted by the ranking logic. Used both to finalise and to render the board.
function rankBestAttempts(attempts) {
    const bestByUser = new Map();
    for (const a of attempts) {
        const key = String(a.user);
        const cur = bestByUser.get(key);
        if (!cur || compareAttempts(a, cur) < 0) bestByUser.set(key, a);
    }
    const best = [...bestByUser.values()];
    best.sort(compareAttempts);
    return best;
}

// Finalise a test's leaderboard EXACTLY ONCE. Idempotent and concurrency-safe:
// whoever flips `leaderboardPublished` first (atomic update) is the sole caller
// that writes ranks, increments achievements, and sends the topper notification.
// Everyone else short-circuits. Safe to call from the scheduler and lazily on read.
async function finalizeTestLeaderboard(testId) {
    const test = await Test.findById(testId);
    if (!test || !isDue(test)) return { finalized: false, test };

    // Atomic claim: only the winner gets a document back.
    const claimed = await Test.findOneAndUpdate(
        { _id: test._id, leaderboardPublished: false },
        { $set: { leaderboardPublished: true, leaderboardPublishedAt: new Date() } },
        { returnDocument: "after" }
    );
    if (!claimed) return { finalized: false, test }; // lost the race — already done

    try {
        const attempts = await Attempt.find({ test: test._id }).select(
            "user score durationTakenSeconds submittedAt"
        );
        const ranked = rankBestAttempts(attempts);

        // Reset any stale ranks, then stamp 1..N onto each user's best attempt.
        await Attempt.updateMany({ test: test._id }, { $set: { rank: null } });
        const bulk = [];
        const top3 = [];
        ranked.forEach((a, i) => {
            const pos = i + 1;
            bulk.push({ updateOne: { filter: { _id: a._id }, update: { $set: { rank: pos } } } });
            if (pos <= 3) top3.push({ user: a.user, rank: pos });
        });
        if (bulk.length) await Attempt.bulkWrite(bulk);

        // Permanent Top-3 counters — incremented once (we hold the claim).
        for (const { user, rank } of top3) {
            const field =
                rank === 1 ? "achievements.rank1" : rank === 2 ? "achievements.rank2" : "achievements.rank3";
            await User.updateOne({ _id: user }, { $inc: { [field]: 1 } });
        }

        // Notify every participant that the board is live, naming the champion.
        const participantIds = [...new Set(attempts.map((a) => String(a.user)))].map(
            (id) => new mongoose.Types.ObjectId(id)
        );
        if (participantIds.length) {
            const champ = ranked[0] ? await User.findById(ranked[0].user).select("name") : null;
            const champName = (champ && champ.name) || "a top scorer";
            await Notification.create({
                title: `🏆 Leaderboard live: ${test.title}`.slice(0, 120),
                body: `The leaderboard for "${test.title}" is now live! Congratulations to ${champName} on Rank #1. Open the app to see where you finished.`.slice(
                    0,
                    1000
                ),
                type: "leaderboard",
                test: test._id,
                recipients: participantIds,
                createdBy: test.createdBy || undefined,
            });
        }

        return {
            finalized: true,
            test: claimed,
            participants: participantIds.length,
            ranked: ranked.length,
        };
    } catch (err) {
        // The flag is already set; log for investigation rather than throw so a
        // lazy read still returns the (mostly-finalised) board.
        console.error(`[leaderboard] finalize failed for ${test._id}:`, err.message);
        return { finalized: false, test: claimed, error: err.message };
    }
}

// Finalise every test whose window closed at least the cool-off ago and hasn't
// been published. Called on an interval by the scheduler.
async function processDueLeaderboards() {
    const cutoff = new Date(Date.now() - REVEAL_DELAY_MS);
    const due = await Test.find({
        mode: "test",
        leaderboardPublished: false,
        closeAt: { $ne: null, $lte: cutoff },
    }).select("_id");
    let count = 0;
    for (const t of due) {
        const r = await finalizeTestLeaderboard(t._id);
        if (r.finalized) count += 1;
    }
    return count;
}

module.exports = {
    REVEAL_DELAY_MS,
    isCompetitive,
    revealAt,
    isDue,
    compareAttempts,
    rankBestAttempts,
    finalizeTestLeaderboard,
    processDueLeaderboards,
};
