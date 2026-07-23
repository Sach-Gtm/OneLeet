const mongoose = require("mongoose");
const Test = require("../../models/testModel");
const Question = require("../../models/questionModel");
const AiQuery = require("../../models/aiQueryModel");
const ai = require("../../services/ai/aiService");
const runtime = require("../../services/ai/aiRuntime");
const { sanitizeExams } = require("../../config/exams");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const notFound = (res) => res.status(404).json({ success: false, message: "Not found" });

// Validate + clean a list of drafted questions into Question payloads. Throws a
// 400-tagged error on bad input so the caller returns a helpful message.
function normalizeQuestions(list, { subject = "", topic = "" } = {}) {
    if (!Array.isArray(list) || list.length === 0) {
        const e = new Error("Add at least one question");
        e.status = 400;
        throw e;
    }
    return list.map((q, i) => {
        const text = String(q.text || q.question || "").trim();
        const options = (Array.isArray(q.options) ? q.options : [])
            .map((o) => String(o).trim())
            .filter(Boolean);
        if (!text) {
            const e = new Error(`Question ${i + 1} is missing its text`);
            e.status = 400;
            throw e;
        }
        if (options.length < 2) {
            const e = new Error(`Question ${i + 1} needs at least 2 answer options`);
            e.status = 400;
            throw e;
        }
        let correctIndex = Number.isInteger(q.correctIndex)
            ? q.correctIndex
            : Number.isInteger(q.answerIndex)
              ? q.answerIndex
              : 0;
        if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
        return {
            text,
            options,
            correctIndex,
            marks: Math.max(0, parseInt(q.marks, 10) || 1),
            difficulty: ["easy", "moderate", "hard"].includes(q.difficulty) ? q.difficulty : "moderate",
            explanation: String(q.explanation || "").trim(),
            subject: q.subject || subject || "",
            topic: q.topic || topic || "",
        };
    });
}

// POST /api/studio/ai-draft — turn pasted text / a topic into an editable draft.
// Nothing is saved; the mentor reviews and edits before creating a real draft.
async function aiDraft(req, res, next) {
    try {
        const b = req.body || {};
        const params = {
            text: b.text || "",
            subject: b.subject || "",
            topic: b.topic || "",
            mode: b.mode === "practice" ? "practice" : "test",
            count: Math.min(Math.max(parseInt(b.count, 10) || 5, 1), 20),
            difficulty: b.difficulty || "moderate",
        };
        // Staff are unlimited (dailyLimitFor → null), but drafts are still cached
        // and logged so the cost dashboard captures Studio spend too.
        const { result: draft, cacheHit } = await runtime.runAiFeature({
            user: req.user,
            feature: "draft",
            cacheParams: params,
            inputText: params.text,
            generate: () => ai.draftAssessment(params),
        });
        AiQuery.create({
            user: req.user._id,
            tool: "draft",
            subject: b.subject || "",
            topic: b.topic || "",
            difficulty: b.difficulty || "",
        }).catch(() => {});
        return res.status(200).json({ success: true, cached: cacheHit, draft });
    } catch (err) {
        if (err && err.status === 429) {
            return res.status(429).json({ success: false, message: err.message, quota: err.quota });
        }
        next(err);
    }
}

// GET /api/studio/tests — a mentor sees their own content; admins/super see all.
async function listMine(req, res, next) {
    try {
        const filter = req.user.role === "teacher" ? { createdBy: req.user._id } : {};
        const tests = await Test.find(filter)
            .sort({ updatedAt: -1 })
            .limit(100)
            .select("title subject mode status durationMinutes totalMarks questions openAt closeAt targets createdBy createdAt updatedAt");
        return res.status(200).json({
            success: true,
            tests: tests.map((t) => ({
                ...t.toObject(),
                questionCount: t.questions.length,
                questions: undefined,
            })),
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/studio/tests/:id — full content incl. correct answers, for editing.
async function getTest(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return notFound(res);
        const test = await Test.findById(req.params.id).populate("questions");
        if (!test) return notFound(res);
        return res.status(200).json({ success: true, test });
    } catch (err) {
        next(err);
    }
}

// POST /api/studio/tests — save a DRAFT from the (edited) questions.
async function createTest(req, res, next) {
    try {
        const b = req.body || {};
        const normalized = normalizeQuestions(b.questions, { subject: b.subject, topic: b.topic });
        const docs = await Question.insertMany(
            normalized.map((q) => ({ ...q, createdBy: req.user._id }))
        );
        const totalMarks = normalized.reduce((s, q) => s + q.marks, 0);
        const test = await Test.create({
            title: String(b.title || "Untitled set").slice(0, 140),
            description: String(b.description || "").slice(0, 400),
            subject: b.subject || "",
            mode: b.mode === "practice" ? "practice" : "test",
            durationMinutes: Math.max(1, parseInt(b.durationMinutes, 10) || 30),
            openAt: b.openAt || undefined,
            closeAt: b.closeAt || undefined,
            targets: sanitizeExams(b.targets),
            questions: docs.map((d) => d._id),
            totalMarks,
            status: "draft",
            isPublished: false,
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, test });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/studio/tests/:id — edit a draft (fields and/or replace questions).
async function updateTest(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return notFound(res);
        const test = await Test.findById(req.params.id);
        if (!test) return notFound(res);
        const b = req.body || {};
        if (b.title != null) test.title = String(b.title).slice(0, 140);
        if (b.description != null) test.description = String(b.description).slice(0, 400);
        if (b.subject != null) test.subject = b.subject;
        if (b.mode) test.mode = b.mode === "practice" ? "practice" : "test";
        if (b.durationMinutes != null)
            test.durationMinutes = Math.max(1, parseInt(b.durationMinutes, 10) || 30);
        if ("openAt" in b) test.openAt = b.openAt || undefined;
        if ("closeAt" in b) test.closeAt = b.closeAt || undefined;
        if (b.targets != null) test.targets = sanitizeExams(b.targets);
        if (Array.isArray(b.questions)) {
            const normalized = normalizeQuestions(b.questions, { subject: test.subject });
            await Question.deleteMany({ _id: { $in: test.questions } });
            const docs = await Question.insertMany(
                normalized.map((q) => ({ ...q, createdBy: req.user._id }))
            );
            test.questions = docs.map((d) => d._id);
            test.totalMarks = normalized.reduce((s, q) => s + q.marks, 0);
        }
        await test.save();
        return res.status(200).json({ success: true, test });
    } catch (err) {
        next(err);
    }
}

// POST /api/studio/tests/:id/publish — make it live for students.
async function publishTest(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return notFound(res);
        const test = await Test.findById(req.params.id);
        if (!test) return notFound(res);
        if (!test.questions || test.questions.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Add at least one question before publishing" });
        }
        test.status = "published";
        test.isPublished = true;
        await test.save();
        return res.status(200).json({ success: true, test });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/studio/tests/:id — remove a draft/test and its questions.
async function removeTest(req, res, next) {
    try {
        if (!isValidId(req.params.id)) return notFound(res);
        const test = await Test.findById(req.params.id);
        if (!test) return notFound(res);
        await Promise.all([
            Question.deleteMany({ _id: { $in: test.questions } }),
            Test.deleteOne({ _id: test._id }),
        ]);
        return res.status(200).json({ success: true, id: test._id });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    aiDraft,
    listMine,
    getTest,
    createTest,
    updateTest,
    publishTest,
    removeTest,
};
