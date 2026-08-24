const Course = require("../models/courseModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");

// Seeds the "MBA Placement Bootcamp" as a purchasable, counselling-kind course
// (no LEET exam attached). It's a placement-interview bootcamp for final-year MBA
// students and is bought through the normal cart -> order -> Razorpay flow.
// Idempotent boot seed (CLAUDE.md — no direct Atlas write): upsert by slug,
// guarded by a SeedFlag so it runs once and never resurrects a staff-deleted item.
//
// The SEED_KEY is bumped to v2 to re-apply the reframed placement copy (name,
// tagline, description, bullets) over the earlier "Mock PI for aspirants" seed;
// the slug is kept so the /mba page and any existing links keep working.
//
// Pricing: the founder set ₹99,000 with a 5% discount, so mrp = 99000 (struck
// through) and price = 94050 (what the student actually pays). The order flow
// always charges `price` server-side.
const SEED_KEY = "mba-placement-bootcamp-v2";

const SLUG = "mba-mock-pi";
const MRP = 99000; // "original" price, shown struck through
const PRICE = 94050; // 5% off ₹99,000 — the amount actually charged

const WHATS_INSIDE = [
    "30 full mock placement interviews (HR, personal, case & guesstimate rounds), one-on-one and held to real recruiter standard",
    "Interview panels drawn from top consulting backgrounds (including BCG) and premier B-school graduates",
    "Detailed feedback after every round: structure, communication, presence and how you'd land with a real panel",
    "Group Discussion (GD), WAT and extempore practice for the shortlisting rounds",
    "Resume polish and a tight 'walk me through your profile', with company- and role-specific question banks",
    "A final readiness report: your strengths and the exact gaps to close before placement season",
];

const DESCRIPTION =
    "A placement-interview bootcamp for final-year MBA students. You get 30 full " +
    "mock interviews (HR, personal, case and guesstimate rounds) conducted by " +
    "mentors from top consulting backgrounds (including BCG) and graduates of " +
    "premier B-schools, each followed by structured, personalised feedback. It's " +
    "built to get you placement-ready for top companies: sharper answers, a clear " +
    "personal narrative, and the composure to convert any panel.";

const TAGLINE =
    "A placement bootcamp for final-year MBA students: 30 mock interviews to walk into placement season ready to convert.";

async function ensureMbaMockPiSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[mba-mock-pi] no user to attribute yet; will run on a later boot");
            return; // no SeedFlag yet, so a later boot retries
        }

        const fields = {
            name: "MBA Placement Bootcamp",
            examCode: "", // counselling-kind: no LEET exam
            examName: "",
            kind: "counselling",
            tagline: TAGLINE,
            description: DESCRIPTION,
            whatsInside: WHATS_INSIDE,
            successPromise: "",
            price: PRICE,
            mrp: MRP,
            validityDays: 365,
            order: 0,
            published: true,
        };

        const existing = await Course.findOne({ slug: SLUG });
        if (existing) {
            Object.assign(existing, fields);
            await existing.save();
        } else {
            await Course.create({ ...fields, slug: SLUG, createdBy: owner._id });
        }

        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[mba-placement-bootcamp] seeded the MBA Placement Bootcamp (₹${PRICE})`);
    } catch (e) {
        console.warn("[mba-mock-pi] seed skipped:", e.message);
    }
}

module.exports = { ensureMbaMockPiSeeded, MBA_MOCK_PI_SLUG: SLUG };
