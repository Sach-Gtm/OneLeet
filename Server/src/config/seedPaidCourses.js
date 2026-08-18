const Course = require("../models/courseModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { getExams } = require("./exams");

// Publishes / price-corrects the paid exam batches to the founder's launch
// numbers, and attaches the per-exam Success Promise summary. Idempotent boot
// seed (CLAUDE.md — no direct Atlas write): per-slug upsert, guarded by a flag.
// The two original Foundation batches are UPDATED in place (their launch prices
// changed); the rest are created. Counselling-only packs are seeded separately.
//
// v2: lower the struck-through `mrp` (the "original" price) to more believable
// launch numbers. The paid `price` students actually pay is unchanged; the re-run
// re-applies price/promise (no change) and the new mrp to each existing batch.
const SEED_KEY = "paid-courses-v2";

const WHATS_INSIDE = [
    "Complete master course — notes, short notes, formula sheets & mind maps",
    "Full test series — chapter, topic, weekly, full-length & PYP mocks",
    "Official PYQ library with keys, solutions & difficulty tags",
    "AI mentor — doubt solver, weak-topic detection & study planner",
    "Smart analytics, Rank & College Predictor Pro",
    "Counselling hub + 1:1 / 1:M mentorship and live doubt sessions",
    "A Success Promise backed by clear, per-exam terms",
];

const TNC =
    "By enrolling you agree to the OneLeet Terms of Service and the Success " +
    "Promise policy shown at checkout. Some content is free to explore; the full " +
    "membership (mocks, premium notes, AI mentor and live classes) is the paid " +
    "batch. The Success Promise applies only when all eligibility conditions are met.";

// slug, examCode, launch price / original, and the short Success-Promise summary.
const COURSES = [
    { slug: "ipu-leet-2027-foundation", examCode: "ipu-leet", name: "IPU LEET 2027 Foundation Batch", price: 999, mrp: 1899, order: 0,
      tagline: "Everything for GGSIPU lateral entry — real papers, weekly ranked mocks, seat & cut-off data, and live doubts.",
      promise: "Admission in a top-6 IPU college for a CSE-family branch (CSE / CST / IT / AI-DS / DS / AIML / ITE), or a top-3 college for any other branch — else 100% of the fee back." },
    { slug: "dtu-nsut-leet-2027-foundation", examCode: "dtu-nsut-leet", name: "DTU / NSUT LEET 2027 Foundation Batch", price: 799, mrp: 1799, order: 1,
      tagline: "Crack the DTU / NSUT lateral entry — real papers, weekly ranked mocks, and a plan tied to your exam date.",
      promise: "Secure a top-10 rank → 100% of the fee back. Admission on any seat → 60% back." },
    { slug: "bihar-leet-2027", examCode: "bihar-leet", name: "Bihar LEET 2027 Foundation Batch", price: 699, mrp: 1499, order: 2,
      tagline: "BCECE-LE, done right — real papers, ranked mocks, and college-wise guidance.",
      promise: "Admission in a top-2 college (MIT Muzaffarpur / BCE Bhagalpur) → 50% of the fee back." },
    { slug: "haryana-leet-2027", examCode: "haryana-leet", name: "Haryana LEET 2027 Foundation Batch", price: 999, mrp: 1899, order: 3,
      tagline: "HSTES lateral entry — targeted prep for the Haryana colleges that matter.",
      promise: "Admission in YMCA (J.C. Bose) → 50% back. Top-50 rank without YMCA → 30% back." },
    { slug: "up-leet-2027", examCode: "up-leet", name: "CUET / UP LEET 2027 Foundation Batch", price: 1499, mrp: 2499, order: 4,
      tagline: "AKTU lateral entry across 700+ colleges — mocks, PYQs and a rank-focused plan.",
      promise: "Secure a top-10 rank → 100% back. Admission in a top-3 college → 40% back." },
    { slug: "gujarat-d2d-2027", examCode: "gujarat-d2d", name: "Gujarat LEET 2027 Foundation Batch", price: 599, mrp: 1999, order: 5,
      tagline: "ACPDC Diploma-to-Degree — ultra-affordable govt colleges, mapped out for you.",
      promise: "Performance-based Success Reward — see the full per-exam terms at checkout." },
    { slug: "sliet-leet-2027", examCode: "sliet-leet", name: "SLIET LEET 2027 Foundation Batch", price: 999, mrp: 1899, order: 6,
      tagline: "SLIET Longowal lateral entry — the central-government route, prepped end to end.",
      promise: "Performance-based Success Reward — see the full per-exam terms at checkout." },
];

async function ensurePaidCoursesSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[paid-courses] no user to attribute yet; will run on a later boot");
            return;
        }

        const catalog = getExams();
        let created = 0;
        let updated = 0;
        for (const c of COURSES) {
            const examName = catalog.find((e) => e.code === c.examCode)?.name || "";
            const existing = await Course.findOne({ slug: c.slug });
            if (existing) {
                // One-time launch-price correction + Success Promise on the batches
                // that were seeded earlier at different prices.
                existing.price = c.price;
                existing.mrp = c.mrp;
                existing.successPromise = c.promise;
                existing.validityDays = existing.validityDays || 365;
                existing.kind = "exam";
                if (!existing.published) existing.published = true;
                await existing.save();
                updated++;
            } else {
                await Course.create({
                    name: c.name,
                    slug: c.slug,
                    examCode: c.examCode,
                    examName,
                    kind: "exam",
                    tagline: c.tagline,
                    description: `${c.name} is a structured, exam-only prep batch built by someone who cleared LEET. Drill real past papers with verified keys, sit weekly full-length mocks with an All-India rank, and follow a plan tied to your exam date.`,
                    whatsInside: WHATS_INSIDE,
                    termsAndConditions: TNC,
                    successPromise: c.promise,
                    price: c.price,
                    mrp: c.mrp,
                    validityDays: 365,
                    order: c.order,
                    published: true,
                    createdBy: owner._id,
                });
                created++;
            }
        }
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[paid-courses] created ${created}, price-corrected ${updated} exam batch(es)`);
    } catch (e) {
        console.warn("[paid-courses] seed skipped:", e.message);
    }
}

module.exports = { ensurePaidCoursesSeeded, COURSES };
