const Course = require("../models/courseModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { getExams } = require("./exams");

// Publishes the first two college-wise Foundation batches once (idempotent boot
// seed, per CLAUDE.md — no direct Atlas write). Admins add more from the Course
// panel. Enrollment is free; the "what's inside" reflects the paid batch.
const SEED_KEY = "foundation-courses-v1";

const WHATS_INSIDE = [
    "Every real past paper (PYQ), solved with the official answer key",
    "Weekly full-length mock tests with an All-India rank",
    "Chapter-wise notes and daily practice (DPP)",
    "Seat matrix, round-wise cut-offs and a college predictor",
    "A live doubt class every week, plus a few 1:1 sessions",
    "Syllabus tracker, progress analytics and AI weak-topic analysis",
    "A private batch community group",
];

const TNC =
    "By enrolling you agree to use the material for your own preparation only. " +
    "Batch access is for the current cycle. Some content is free to explore; the " +
    "full mocks, premium notes and live doubt classes are part of the paid batch. " +
    "Refund and cancellation terms are shown at checkout.";

const COURSES = [
    {
        name: "IPU LEET 2027 Foundation Batch",
        slug: "ipu-leet-2027-foundation",
        examCode: "ipu-leet",
        tagline: "Everything for GGSIPU lateral entry, real papers, weekly ranked mocks, seat & cut-off data, and live doubts.",
        order: 0,
    },
    {
        name: "DTU / NSUT LEET 2027 Foundation Batch",
        slug: "dtu-nsut-leet-2027-foundation",
        examCode: "dtu-nsut-leet",
        tagline: "Crack the DTU / NSUT lateral entry, real papers, weekly ranked mocks, and a plan tied to your exam date.",
        order: 1,
    },
];

const description = (name) =>
    `${name} is a structured, exam-only prep batch built by someone who cleared LEET. ` +
    "A large share of every year's paper repeats, so you drill real past papers with " +
    "verified official keys, sit weekly full-length mocks with an All-India rank, and " +
    "follow a plan tied to your exam date, not scattered videos.";

async function ensureFoundationCoursesSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[foundation-courses] no user to attribute yet; will publish on a later boot");
            return;
        }

        const catalog = getExams();
        for (const c of COURSES) {
            if (await Course.findOne({ slug: c.slug }).select("_id").lean()) continue; // never duplicate
            await Course.create({
                name: c.name,
                slug: c.slug,
                examCode: c.examCode,
                examName: catalog.find((e) => e.code === c.examCode)?.name || "",
                tagline: c.tagline,
                description: description(c.name),
                whatsInside: WHATS_INSIDE,
                termsAndConditions: TNC,
                price: 2999,
                mrp: 4999,
                seatCap: 0,
                order: c.order,
                published: true,
                createdBy: owner._id,
            });
            console.log(`[foundation-courses] published ${c.name}`);
        }
        await SeedFlag.create({ key: SEED_KEY });
    } catch (e) {
        console.warn("[foundation-courses] seed skipped:", e.message);
    }
}

module.exports = { ensureFoundationCoursesSeeded, COURSES };
