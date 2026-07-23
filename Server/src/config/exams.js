// Catalog of LEET / lateral-entry (diploma → 2nd-year B.Tech) entrance exams
// across India. Content (tests, syllabi, notes) is TARGETED at one or more of
// these; students pick which they're preparing for and see only matching
// content. `code` is stable (stored in data) — edit names / add or remove
// entries freely; new codes become selectable everywhere automatically.
//
// A content item with an empty `targets` array (or targets: ["all"]) is shown
// to EVERY student, so legacy/untargeted content never disappears.

const EXAMS = [
    // ── Delhi ──
    { code: "ipu-leet", name: "IPU LEET (GGSIPU)", group: "Delhi NCR" },
    { code: "dtu-leet", name: "DTU Lateral Entry", group: "Delhi NCR" },
    { code: "nsut-leet", name: "NSUT Lateral Entry", group: "Delhi NCR" },

    // ── North India (state exams) ──
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

    // ── Private / Deemed universities (own lateral-entry tests) ──
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

const EXAM_CODES = new Set(EXAMS.map((e) => e.code));

const isValidExam = (code) => code === "all" || EXAM_CODES.has(code);

// Clean an incoming list of codes: keep only known codes, de-dupe. If "all" is
// present, collapse to exactly ["all"]. Used when saving a content item's targets
// and a student's chosen exams.
function sanitizeExams(input, { allowAll = true } = {}) {
    if (!Array.isArray(input)) return [];
    const set = new Set(input.map((c) => String(c).trim()).filter(Boolean));
    if (allowAll && set.has("all")) return ["all"];
    set.delete("all");
    return [...set].filter((c) => EXAM_CODES.has(c));
}

// Mongo condition selecting content VISIBLE to a student with these chosen exams.
// No preference set (empty) → everything. Content with no targets, or targeted at
// "all", or overlapping the student's exams, is visible.
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

// JS equivalent of visibilityQuery for already-loaded docs.
function isVisibleTo(targets, studentExams) {
    if (!Array.isArray(studentExams) || studentExams.length === 0) return true;
    if (!Array.isArray(targets) || targets.length === 0) return true;
    if (targets.includes("all")) return true;
    return targets.some((t) => studentExams.includes(t));
}

module.exports = { EXAMS, EXAM_CODES, isValidExam, sanitizeExams, visibilityQuery, isVisibleTo };
