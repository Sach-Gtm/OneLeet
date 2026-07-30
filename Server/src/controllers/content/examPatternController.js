const ExamPattern = require("../../models/examPatternModel");
const { isValidExam, getExams } = require("../../config/exams");

const DIFFICULTIES = ["Easy", "Moderate", "Hard", ""];

// Trim a string field to a max length (undefined when empty, so we don't store
// empty strings all over the document).
const str = (v, max) => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s ? s.slice(0, max) : undefined;
};

// A non-negative integer within [0, max], or undefined.
const num = (v, max) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.min(n, max);
};

const cleanSections = (input) =>
    (Array.isArray(input) ? input : [])
        .map((s) => ({
            name: str(s?.name, 80),
            subjects: str(s?.subjects, 500),
            questions: num(s?.questions, 2000),
            marks: num(s?.marks, 20000),
            difficulty: DIFFICULTIES.includes(s?.difficulty) ? s.difficulty : "",
        }))
        // Drop rows the admin left completely blank.
        .filter((s) => s.name || s.subjects || s.questions != null || s.marks != null)
        .slice(0, 20);

const cleanColleges = (input) =>
    (Array.isArray(input) ? input : [])
        .map((c) => ({
            name: str(c?.name, 140),
            location: str(c?.location, 120),
            avgPackage: str(c?.avgPackage, 60),
        }))
        .filter((c) => c.name)
        .slice(0, 20);

// Everything an admin may set on a pattern, cleaned. Shared by create + update.
function patternFromBody(body = {}) {
    return {
        examName: str(body.examName, 140),
        conductingBody: str(body.conductingBody, 140),
        place: str(body.place, 140),
        eligibility: str(body.eligibility, 2000),
        fees: str(body.fees, 400),
        examMode: str(body.examMode, 80),
        duration: str(body.duration, 80),
        totalQuestions: num(body.totalQuestions, 5000),
        totalMarks: num(body.totalMarks, 100000),
        sections: cleanSections(body.sections),
        markingCorrect: str(body.markingCorrect, 40),
        markingNegative: str(body.markingNegative, 40),
        markingNote: str(body.markingNote, 400),
        avgPlacement: str(body.avgPlacement, 80),
        topColleges: cleanColleges(body.topColleges),
        importantDates: str(body.importantDates, 800),
        officialWebsite: str(body.officialWebsite, 300),
        notes: str(body.notes, 2500),
        order: num(body.order, 100000) ?? 0,
    };
}

const shape = (p) => ({
    _id: p._id,
    examCode: p.examCode,
    examName: p.examName,
    conductingBody: p.conductingBody,
    place: p.place,
    eligibility: p.eligibility,
    fees: p.fees,
    examMode: p.examMode,
    duration: p.duration,
    totalQuestions: p.totalQuestions,
    totalMarks: p.totalMarks,
    sections: (p.sections || []).map((s) => ({
        name: s.name,
        subjects: s.subjects,
        questions: s.questions,
        marks: s.marks,
        difficulty: s.difficulty,
    })),
    markingCorrect: p.markingCorrect,
    markingNegative: p.markingNegative,
    markingNote: p.markingNote,
    avgPlacement: p.avgPlacement,
    topColleges: (p.topColleges || []).map((c) => ({
        name: c.name,
        location: c.location,
        avgPackage: c.avgPackage,
    })),
    importantDates: p.importantDates,
    officialWebsite: p.officialWebsite,
    notes: p.notes,
    published: p.published,
    order: p.order,
});

// GET /api/exam-patterns/me — the signed-in student's exams only (published).
// Returns the paper patterns for whichever exams they picked in their profile.
async function listMine(req, res, next) {
    try {
        const codes = Array.isArray(req.user.exams) ? req.user.exams : [];
        if (codes.length === 0) {
            return res.status(200).json({ success: true, patterns: [] });
        }
        const patterns = await ExamPattern.find({ published: true, examCode: { $in: codes } })
            .sort({ order: 1, examName: 1 })
            .lean();
        return res.status(200).json({ success: true, patterns: patterns.map(shape) });
    } catch (e) {
        next(e);
    }
}

// GET /api/exam-patterns — ADMIN. Every pattern (published or not) to manage.
async function listAll(req, res, next) {
    try {
        const patterns = await ExamPattern.find({}).sort({ order: 1, examName: 1 }).lean();
        return res.status(200).json({ success: true, patterns: patterns.map(shape) });
    } catch (e) {
        next(e);
    }
}

// POST /api/exam-patterns — ADMIN. Create a pattern for a catalog exam.
async function createPattern(req, res, next) {
    try {
        const examCode = str(req.body.examCode, 60);
        if (!examCode || !isValidExam(examCode) || examCode === "all") {
            return res.status(400).json({ success: false, message: "Pick a valid exam for this pattern." });
        }
        const fields = patternFromBody(req.body);
        if (!fields.examName) {
            // Fall back to the catalog's display name if the admin left it blank.
            fields.examName = getExams().find((e) => e.code === examCode)?.name;
        }
        if (!fields.examName) {
            return res.status(400).json({ success: false, message: "Give the exam a name." });
        }

        const pattern = await ExamPattern.create({
            examCode,
            ...fields,
            published: req.body.published === false ? false : true,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: "Paper pattern added", pattern: shape(pattern) });
    } catch (e) {
        next(e);
    }
}

// PATCH /api/exam-patterns/:id — ADMIN. Replace the editable fields.
async function updatePattern(req, res, next) {
    try {
        const pattern = await ExamPattern.findById(req.params.id);
        if (!pattern) return res.status(404).json({ success: false, message: "Pattern not found" });

        if (req.body.examCode !== undefined) {
            const examCode = str(req.body.examCode, 60);
            if (!examCode || !isValidExam(examCode) || examCode === "all") {
                return res.status(400).json({ success: false, message: "Pick a valid exam for this pattern." });
            }
            pattern.examCode = examCode;
        }

        const fields = patternFromBody(req.body);
        if (!fields.examName) {
            return res.status(400).json({ success: false, message: "Give the exam a name." });
        }
        Object.assign(pattern, fields);
        if (req.body.published !== undefined) pattern.published = !!req.body.published;

        await pattern.save();
        return res.status(200).json({ success: true, message: "Paper pattern updated", pattern: shape(pattern) });
    } catch (e) {
        next(e);
    }
}

// DELETE /api/exam-patterns/:id — ADMIN.
async function deletePattern(req, res, next) {
    try {
        const existing = await ExamPattern.findByIdAndDelete(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: "Pattern not found" });
        return res.status(200).json({ success: true, message: "Paper pattern removed" });
    } catch (e) {
        next(e);
    }
}

module.exports = { listMine, listAll, createPattern, updatePattern, deletePattern };
