// LEET / lateral-entry exam catalog. The list lives in the DATABASE (the Exam
// collection) so an admin can add/remove entries from the Admin panel and it
// takes effect GLOBALLY. To keep validation/filtering synchronous, this module
// holds an in-memory cache: it starts from SEED_EXAMS, seeds the DB from that
// list the first time the server runs, and reloads the cache after each admin
// edit. Content with empty `targets` (or ["all"]) is shown to every student.

const SEED_EXAMS = [
    // ── Delhi ──
    { code: "ipu-leet", name: "IPU LEET (GGSIPU)", group: "Delhi NCR" },
    { code: "dtu-leet", name: "DTU Lateral Entry", group: "Delhi NCR" },
    { code: "nsut-leet", name: "NSUT Lateral Entry", group: "Delhi NCR" },
    // ── North India ──
    { code: "up-leet", name: "UP LEET (AKTU)", group: "North India" },
    { code: "bihar-leet", name: "Bihar LEET (BCECE-LE)", group: "North India" },
    { code: "jharkhand-leet", name: "Jharkhand LEET (JCECE-LE)", group: "North India" },
    { code: "haryana-leet", name: "Haryana LEET (HSTES)", group: "North India" },
    { code: "punjab-leet", name: "Punjab LEET (IKGPTU)", group: "North India" },
    { code: "rajasthan-leet", name: "Rajasthan Lateral Entry (REAP)", group: "North India" },
    { code: "uttarakhand-leet", name: "Uttarakhand LEET (UKSEE)", group: "North India" },
    { code: "himachal-leet", name: "Himachal Pradesh LEET", group: "North India" },
    { code: "jk-leet", name: "J&K Lateral Entry (BOPEE)", group: "North India" },
    // ── Central & West ──
    { code: "mp-leet", name: "Madhya Pradesh Lateral Entry (DTE)", group: "Central & West" },
    { code: "chhattisgarh-leet", name: "Chhattisgarh Lateral Entry (CSVTU)", group: "Central & West" },
    { code: "maharashtra-dse", name: "Maharashtra Direct 2nd Year (DSE)", group: "Central & West" },
    { code: "gujarat-d2d", name: "Gujarat Diploma-to-Degree (ACPDC)", group: "Central & West" },
    // ── East & North-East ──
    { code: "wb-jelet", name: "West Bengal JELET", group: "East & North-East" },
    { code: "odisha-ojee", name: "Odisha Lateral Entry (OJEE)", group: "East & North-East" },
    { code: "assam-jlee", name: "Assam JLEE (ASTU)", group: "East & North-East" },
    // ── South India ──
    { code: "karnataka-dcet", name: "Karnataka DCET", group: "South India" },
    { code: "kerala-let", name: "Kerala LET (LBS)", group: "South India" },
    { code: "ap-ecet", name: "Andhra Pradesh ECET", group: "South India" },
    { code: "ts-ecet", name: "Telangana ECET (TS ECET)", group: "South India" },
    { code: "tamilnadu-le", name: "Tamil Nadu Lateral Entry (DOTE)", group: "South India" },
    // ── Private / Deemed universities ──
    { code: "lpu-nest", name: "LPU (LPUNEST)", group: "Private / Deemed" },
    { code: "chandigarh-cucet", name: "Chandigarh University (CUCET)", group: "Private / Deemed" },
    { code: "kiit-kiitee", name: "KIIT (KIITEE)", group: "Private / Deemed" },
    { code: "bit-mesra", name: "BIT Mesra", group: "Private / Deemed" },
    { code: "vit-viteee", name: "VIT (VITEEE)", group: "Private / Deemed" },
    { code: "srm-srmjeee", name: "SRM (SRMJEEE)", group: "Private / Deemed" },
    { code: "amity-jee", name: "Amity University", group: "Private / Deemed" },
    { code: "manipal-met", name: "Manipal (MET)", group: "Private / Deemed" },
    { code: "amrita-aeee", name: "Amrita (AEEE)", group: "Private / Deemed" },
    { code: "sharda-set", name: "Sharda University (SET)", group: "Private / Deemed" },
    { code: "galgotias", name: "Galgotias University", group: "Private / Deemed" },
];

// In-memory cache — starts as the seed so everything works before/without a DB.
let cachedExams = SEED_EXAMS.map((e) => ({ ...e }));
let codeSet = new Set(SEED_EXAMS.map((e) => e.code));

// Current catalog (for GET /api/exams and the pickers).
const getExams = () => cachedExams;

const isValidExam = (code) => code === "all" || codeSet.has(code);

// Clean an incoming list of codes: keep only known codes, de-dupe. "all" (when
// allowed) collapses to exactly ["all"].
function sanitizeExams(input, { allowAll = true } = {}) {
    if (!Array.isArray(input)) return [];
    const set = new Set(input.map((c) => String(c).trim()).filter(Boolean));
    if (allowAll && set.has("all")) return ["all"];
    set.delete("all");
    return [...set].filter((c) => codeSet.has(c));
}

// Mongo condition selecting content VISIBLE to a student with these chosen exams.
function visibilityQuery(studentExams) {
    if (!Array.isArray(studentExams) || studentExams.length === 0) return {};
    return {
        $or: [
            { targets: { $exists: false } },
            { targets: { $size: 0 } },
            { targets: "all" },
            { targets: { $in: studentExams } },
        ],
    };
}

function isVisibleTo(targets, studentExams) {
    if (!Array.isArray(studentExams) || studentExams.length === 0) return true;
    if (!Array.isArray(targets) || targets.length === 0) return true;
    if (targets.includes("all")) return true;
    return targets.some((t) => studentExams.includes(t));
}

// Reload the in-memory cache from the DB (called at startup and after admin edits).
// Falls back to the seed cache if the collection is empty or the query fails.
async function refreshExams() {
    try {
        const Exam = require("../models/examModel");
        const rows = await Exam.find().sort({ order: 1, group: 1, name: 1 }).lean();
        if (rows.length) {
            cachedExams = rows.map((r) => ({ code: r.code, name: r.name, group: r.group || "Other" }));
            codeSet = new Set(rows.map((r) => r.code));
        }
    } catch {
        /* keep the seed cache */
    }
    return cachedExams;
}

// Seed the DB from SEED_EXAMS the first time, then load the cache.
async function ensureExamsSeeded() {
    try {
        const Exam = require("../models/examModel");
        if ((await Exam.estimatedDocumentCount()) === 0) {
            await Exam.insertMany(
                SEED_EXAMS.map((e, i) => ({ ...e, order: i })),
                { ordered: false }
            ).catch(() => {});
        }
    } catch {
        /* ignore — cache still holds the seed */
    }
    return refreshExams();
}

module.exports = {
    SEED_EXAMS,
    getExams,
    isValidExam,
    sanitizeExams,
    visibilityQuery,
    isVisibleTo,
    refreshExams,
    ensureExamsSeeded,
};
