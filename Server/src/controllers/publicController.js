// PUBLIC (no-login) read APIs backing the marketing "EXAMS" pages — everything a
// visitor can explore before signing up: exam pattern + eligibility, syllabus,
// seat matrix, cut-offs and sample PYQs, all from the live DB. These are
// deliberately separate from the authenticated content routes so the app's
// internal behaviour is untouched; per-page LOGIN/PREMIUM gates are layered on
// top of these (a visitor is treated as a free, un-enrolled user):
//   • cut-offs         → fully public
//   • seat matrix      → public (college-wise)
//   • syllabus         → public to VIEW; premium chapters withheld (locked)
//   • sample PYQs      → public to VIEW; the file URL is withheld (download gated)
//   • exam pattern     → fully public (SEO)
const ExamPattern = require("../models/examPatternModel");
const Syllabus = require("../models/syllabusModel");
const Pyq = require("../models/pyqModel");
const SeatMatrix = require("../models/seatMatrixModel");
const CutoffMatrix = require("../models/cutoffMatrixModel");
const { getExams, isValidExam, visibilityQuery } = require("../config/exams");
const { shape: shapePattern } = require("./content/examPatternController");

// A valid single exam code from the path (never "all", never bogus) → null if not.
const code = (req) => {
    const c = String(req.params.code || "").trim();
    return c && c !== "all" && isValidExam(c) ? c : null;
};

// Content a PUBLIC visitor may see for one exam: published + universal-or-targeted.
// (Same rule as an enrolled student's visibility for that one code.)
const publicFilter = (examCode) => ({ published: true, ...visibilityQuery([examCode]) });

// GET /api/public/exams — the LEET catalog (for the mega-menu + exam pickers).
function catalog(req, res) {
    return res.status(200).json({ success: true, exams: getExams() });
}

// GET /api/public/exams/:code/overview — which panels have data for this exam, so
// the marketing page only shows sections that exist.
async function overview(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const exam = getExams().find((e) => e.code === c) || { code: c, name: c };
        const [pattern, seat, cutoff, syllabusN, pyqN] = await Promise.all([
            ExamPattern.exists({ examCode: c, published: true }),
            SeatMatrix.exists({ examCode: c, published: true }),
            CutoffMatrix.exists({ examCode: c, published: true }),
            Syllabus.countDocuments({ scope: "global", ...publicFilter(c) }),
            Pyq.countDocuments({ stateExam: c }),
        ]);
        return res.status(200).json({
            success: true,
            exam: { code: exam.code, name: exam.name, group: exam.group || "" },
            has: {
                pattern: !!pattern,
                eligibility: !!pattern, // eligibility rides on the pattern doc
                seatMatrix: !!seat,
                cutoffs: !!cutoff,
                syllabus: syllabusN > 0,
                pyqs: pyqN > 0,
            },
        });
    } catch (e) {
        next(e);
    }
}

// GET /api/public/exams/:code/pattern — the paper pattern + eligibility (public).
async function pattern(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const p = await ExamPattern.findOne({ examCode: c, published: true }).lean();
        if (!p) return res.status(404).json({ success: false, message: "No pattern for this exam yet" });
        return res.status(200).json({ success: true, pattern: shapePattern(p) });
    } catch (e) {
        next(e);
    }
}

// GET /api/public/exams/:code/syllabus — published global syllabi (view-only).
// Premium syllabi stay in the list but their chapters are withheld (locked).
async function syllabus(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const rows = await Syllabus.find({ scope: "global", ...publicFilter(c) })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        const syllabi = rows.map((s) => {
            const locked = !!s.premium; // a visitor is a free user
            return {
                _id: s._id,
                title: s.title,
                subject: s.subject || "",
                premium: !!s.premium,
                locked,
                chapters: locked ? [] : s.chapters || [],
            };
        });
        return res.status(200).json({ success: true, syllabi });
    } catch (e) {
        next(e);
    }
}

// GET /api/public/exams/:code/seat-matrix — the college→branch seat intake (public).
async function seatMatrix(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const matrix = await SeatMatrix.findOne({ examCode: c, published: true }).lean();
        if (!matrix) return res.status(404).json({ success: false, message: "No seat matrix for this exam yet" });
        const colleges = [...(matrix.colleges || [])].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
        );
        return res.status(200).json({ success: true, matrix: { ...matrix, colleges } });
    } catch (e) {
        next(e);
    }
}

// GET /api/public/exams/:code/cutoffs — round-wise closing ranks (fully public).
async function cutoffs(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const matrix = await CutoffMatrix.findOne({ examCode: c, published: true }).lean();
        if (!matrix) return res.status(404).json({ success: false, message: "No cut-offs for this exam yet" });
        return res.status(200).json({ success: true, matrix });
    } catch (e) {
        next(e);
    }
}

// GET /api/public/exams/:code/pyqs — sample past-year papers (public to VIEW). The
// file URL is withheld — downloading is gated behind login (handled on the client).
async function pyqs(req, res, next) {
    try {
        const c = code(req);
        if (!c) return res.status(404).json({ success: false, message: "Unknown exam" });
        const rows = await Pyq.find({ stateExam: c })
            .select("title year stateExam branch subject topic difficulty tag questionsCount createdAt")
            .sort({ year: -1, createdAt: -1 })
            .limit(24)
            .lean();
        // No fileUrl in the projection → a visitor can browse but not download.
        const pyqsOut = rows.map((p) => ({ ...p, downloadRequiresLogin: true }));
        return res.status(200).json({ success: true, pyqs: pyqsOut });
    } catch (e) {
        next(e);
    }
}

module.exports = { catalog, overview, pattern, syllabus, seatMatrix, cutoffs, pyqs };
