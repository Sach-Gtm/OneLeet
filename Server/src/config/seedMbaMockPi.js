const Course = require("../models/courseModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");

// Seeds the MBA "Mock PI" (Personal Interview) program as a purchasable,
// counselling-kind course (no LEET exam attached). It surfaces on /pricing under
// its own MBA section and is bought through the normal cart -> order -> Razorpay
// flow. Idempotent boot seed (CLAUDE.md — no direct Atlas write): upsert by slug,
// guarded by a SeedFlag so it runs once and never resurrects a staff-deleted item.
//
// Pricing: the founder set ₹99,000 with a 5% discount, so mrp = 99000 (struck
// through) and price = 94050 (what the student actually pays). The order flow
// always charges `price` server-side.
const SEED_KEY = "mba-mock-pi-v1";

const SLUG = "mba-mock-pi";
const MRP = 99000; // "original" price, shown struck through
const PRICE = 94050; // 5% off ₹99,000 — the amount actually charged

const WHATS_INSIDE = [
    "30 full mock Personal Interviews (PIs), one-on-one and held to real B-school interview standard",
    "Interview panels drawn from top consulting backgrounds (including BCG) and premier B-school graduates",
    "Detailed feedback after every interview: content, structure, communication and body language",
    "WAT / essay and extempore practice mapped to each interview round",
    "Profile-based question banks: academics, work experience, current affairs and your 'why MBA' story",
    "A final readiness report with your strengths and the exact gaps to close before the real PI",
];

const DESCRIPTION =
    "A dedicated Personal Interview (PI) preparation program for MBA aspirants. " +
    "You get 30 full mock interviews conducted by mentors from top consulting " +
    "backgrounds (including BCG) and graduates of premier B-schools, each followed " +
    "by structured, personalised feedback. The program is built to take you from " +
    "nervous to interview-ready: sharper answers, a clear personal narrative, and " +
    "the composure to handle any panel.";

const TAGLINE =
    "30 mock personal interviews with mentors from top consulting and premier B-school backgrounds.";

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
            name: "MBA Mock PI Program",
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
        console.log(`[mba-mock-pi] seeded the MBA Mock PI program (₹${PRICE})`);
    } catch (e) {
        console.warn("[mba-mock-pi] seed skipped:", e.message);
    }
}

module.exports = { ensureMbaMockPiSeeded, MBA_MOCK_PI_SLUG: SLUG };
