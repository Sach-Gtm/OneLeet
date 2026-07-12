const Question = require("../../models/questionModel");

// POST /api/questions — add a question to the bank (teacher/admin).
async function createQuestion(req, res, next) {
    try {
        const { text, options, correctIndex, subject, topic, difficulty, explanation, marks } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: "Question text is required." });
        }
        const cleanOptions = Array.isArray(options)
            ? options.map((o) => (o || "").trim()).filter(Boolean)
            : [];
        if (cleanOptions.length < 2) {
            return res.status(400).json({ success: false, message: "Add at least 2 answer options." });
        }
        const ci = Number(correctIndex);
        if (!Number.isInteger(ci) || ci < 0 || ci >= cleanOptions.length) {
            return res.status(400).json({ success: false, message: "Please mark which option is correct." });
        }

        const question = await Question.create({
            text: text.trim(),
            options: cleanOptions,
            correctIndex: ci,
            subject: subject?.trim(),
            topic: topic?.trim(),
            difficulty: difficulty || "moderate",
            explanation: explanation?.trim(),
            marks: marks ? Number(marks) : 1,
            createdBy: req.user._id,
        });

        return res.status(201).json({ success: true, message: "Question added to the bank.", question });
    } catch (error) {
        next(error);
    }
}

// GET /api/questions — list/search the bank (teacher/admin).
async function listQuestions(req, res, next) {
    try {
        const { subject, difficulty, q, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (subject) filter.subject = subject;
        if (difficulty) filter.difficulty = difficulty;
        if (q && q.trim()) {
            filter.text = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        }
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

        const [questions, total] = await Promise.all([
            Question.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .select("text options correctIndex subject topic difficulty createdAt"),
            Question.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            questions,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
        });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/questions/:id — remove a question (teacher/admin).
async function deleteQuestion(req, res, next) {
    try {
        const deleted = await Question.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Question not found." });
        }
        return res.status(200).json({ success: true, message: "Question deleted." });
    } catch (error) {
        next(error);
    }
}

module.exports = { createQuestion, listQuestions, deleteQuestion };
