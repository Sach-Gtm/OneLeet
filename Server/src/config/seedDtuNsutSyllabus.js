const Syllabus = require("../models/syllabusModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");

const SEED_KEY = "dtu-nsut-syllabus-v1";
const TARGET = "dtu-nsut-leet";

// The DTU / NSUT lateral-entry test-series syllabus, transcribed unit-by-unit
// from the official syllabus sheet, structured subject → unit (chapter) → topic.
// Seeded ONCE (published, targeted to the combined "dtu-nsut-leet" exam) so
// students preparing for DTU/NSUT have a real syllabus to track from day one.
// After seeding these are ordinary records staff can edit/remove in the Content
// Studio; the SeedFlag makes it a one-time publish that never resurrects deletes.
//
// Unit numbers are kept exactly as on the sheet (Maths 1–8, Reasoning 1–12,
// Quantitative Aptitude 13–16) so students can follow along with it directly.
const DTU_NSUT_SYLLABUS = [
    {
        subject: "Mathematics",
        hours: 1.5,
        chapters: [
            { title: "Unit 1 — Number & Operations", topics: ["Ratio and proportion", "Complex numbers"] },
            { title: "Unit 2 — Number Theory", topics: ["Counting", "Elementary number theory", "Matrices and sequences"] },
            { title: "Unit 3 — Algebra & Functions", topics: ["Expressions", "Equations", "Inequalities"] },
            { title: "Unit 4 — Functions", topics: ["Representation and modelling", "Properties of functions"] },
            { title: "Unit 5 — Geometry & Measurement", topics: ["Plane Euclidean geometry", "Coordinate geometry: lines", "Parabolas", "Circles"] },
            { title: "Unit 6 — Mensuration & Solids", topics: ["Symmetry", "Transformations", "Three-dimensional solids", "Surface area and volume"] },
            { title: "Unit 7 — Trigonometry & Statistics", topics: ["Trigonometry: right triangles", "Trigonometric identities", "Data analysis and statistics", "Mean, median and mode"] },
            { title: "Unit 8 — Data Analysis", topics: ["Probability", "Range and interquartile range", "Graphs and plots", "Least squares regression"] },
        ],
    },
    {
        subject: "Reasoning",
        hours: 0.5,
        chapters: [
            { title: "Unit 1 — Verbal Reasoning", topics: ["Analogy", "Classification", "Alphabet test"] },
            { title: "Unit 2 — Analytical Reasoning", topics: ["Logical Venn diagrams", "Syllogism", "Data sufficiency"] },
            { title: "Unit 3 — Non-Verbal Reasoning", topics: ["Analogy", "Classification", "Series"] },
            { title: "Unit 4 — Verbal Reasoning", topics: ["Word formation", "Coding-decoding", "Series completion"] },
            { title: "Unit 5 — Analytical Reasoning", topics: ["Statement and assumption", "Statement and conclusions", "Statement and arguments"] },
            { title: "Unit 6 — Non-Verbal Reasoning", topics: ["Mirror images", "Water images", "Paper folding and cutting"] },
            { title: "Unit 7 — Verbal Reasoning", topics: ["Inserting the missing character", "Number, ranking and time sequence test"] },
            { title: "Unit 8 — Analytical Reasoning", topics: ["Input-output (sequence order tracing)", "Logical order of words"] },
            { title: "Unit 9 — Non-Verbal Reasoning", topics: ["Grouping of identical figures", "Formation of figures", "Counting of figures"] },
            { title: "Unit 10 — Verbal Reasoning", topics: ["Blood relations", "Mathematical operations", "Direction sense test"] },
            { title: "Unit 11 — Non-Verbal Reasoning", topics: ["Embedded figures", "Cube and dice", "Mathematical reasoning"] },
            { title: "Unit 12 — Verbal Reasoning", topics: ["Clock and calendar", "Problems based on ages", "Sitting arrangement"] },
        ],
    },
    {
        subject: "Quantitative Aptitude",
        hours: 0.5,
        chapters: [
            { title: "Unit 13 — Puzzles & Percentage", topics: ["Puzzle test", "Percentage"] },
            { title: "Unit 14 — Commercial Maths", topics: ["Ratio and proportion", "Profit and loss", "Time and work"] },
            { title: "Unit 15 — Arithmetic", topics: ["Pipes and cisterns", "Time, speed and distance", "Number system"] },
            { title: "Unit 16 — Averages & Mensuration", topics: ["Average", "Perimeter, area and volume", "Surface area of various shapes"] },
        ],
    },
];

// Build the Syllabus documents for one owner (createdBy). Chapters/topics get
// sequential `order`s so they display in the authored sequence, and every topic
// carries its subject's per-topic hour estimate.
function buildDocs(ownerId) {
    return DTU_NSUT_SYLLABUS.map((s, i) => ({
        title: s.subject,
        subject: s.subject,
        exam: "DTU / NSUT LEET",
        description: `DTU / NSUT lateral-entry ${s.subject} syllabus.`,
        targets: [TARGET],
        published: true,
        scope: "global",
        order: i,
        createdBy: ownerId,
        chapters: s.chapters.map((c, ci) => ({
            title: c.title,
            order: ci,
            topics: c.topics.map((t, ti) => ({ title: t, estimatedHours: s.hours, order: ti })),
        })),
    }));
}

async function ensureDtuNsutSyllabusSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[dtu-nsut-syllabus] no user to attribute yet; will publish on a later boot");
            return;
        }

        // Add only the subjects not already present (by name) for this exam, so a
        // prior upload is left untouched and nothing is duplicated.
        const present = new Set(
            (await Syllabus.find({ targets: TARGET, scope: "global" }, "subject").lean()).map((s) => s.subject)
        );
        const docs = buildDocs(owner._id).filter((d) => !present.has(d.subject));
        if (docs.length) await Syllabus.insertMany(docs);
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[dtu-nsut-syllabus] published ${docs.length} DTU/NSUT subjects (one-time)`);
    } catch (e) {
        console.warn("[dtu-nsut-syllabus] publish skipped:", e.message);
    }
}

module.exports = { DTU_NSUT_SYLLABUS, buildDocs, ensureDtuNsutSyllabusSeeded };
