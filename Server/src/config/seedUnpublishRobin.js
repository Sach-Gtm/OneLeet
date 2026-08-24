const Mentor = require("../models/mentorModel");
const SeedFlag = require("../models/seedFlagModel");

// One-time: take the "Robin" co-founder profile off the live Mentors page while
// keeping the record intact as a draft (published: false). The public list and
// the journey endpoint both filter published: true, so this hides Robin from
// students; the admin editor lists every mentor regardless, so the profile is
// preserved and can be re-published from the Studio at any time.
//
// Guarded by a SeedFlag so it runs exactly once — if staff later re-publish
// Robin, this migration will not silently undo that on the next boot.
const SEED_KEY = "unpublish-robin-v1";

async function ensureRobinUnpublished() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;
        const res = await Mentor.updateOne({ slug: "robin" }, { $set: { published: false } });
        await SeedFlag.create({ key: SEED_KEY });
        const matched = res.matchedCount ?? res.n ?? 0;
        const modified = res.modifiedCount ?? res.nModified ?? 0;
        console.log(`[unpublish-robin] matched ${matched}, modified ${modified}`);
    } catch (e) {
        console.warn("[unpublish-robin] skipped:", e.message);
    }
}

module.exports = { ensureRobinUnpublished };
