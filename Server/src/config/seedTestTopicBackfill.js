const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const SeedFlag = require("../models/seedFlagModel");

// One-time backfill: older tests were created before `Test.topic` existed, so
// fill it in from the most common topic among each test's questions. This powers
// the "chapter" filter on the Tests page. Idempotent (guarded by a SeedFlag);
// only touches tests that don't already have a topic.
async function ensureTestTopicsBackfilled() {
    try {
        const key = "backfill-test-topic-v1";
        if (await SeedFlag.exists({ key })) return;

        const tests = await Test.find({
            $or: [{ topic: { $exists: false } }, { topic: null }, { topic: "" }],
        })
            .select("_id questions")
            .lean();

        let updated = 0;
        for (const t of tests) {
            if (!t.questions?.length) continue;
            const qs = await Question.find({ _id: { $in: t.questions } }).select("topic").lean();
            const counts = new Map();
            for (const q of qs) {
                const tp = (q.topic || "").trim();
                if (tp) counts.set(tp, (counts.get(tp) || 0) + 1);
            }
            if (!counts.size) continue;
            const topic = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
            await Test.updateOne({ _id: t._id }, { $set: { topic } });
            updated++;
        }
        await SeedFlag.create({ key });
        console.log(`[test-topic-backfill] set topic on ${updated} test(s)`);
    } catch (e) {
        console.warn("[test-topic-backfill] skipped:", e.message);
    }
}

module.exports = { ensureTestTopicsBackfilled };
