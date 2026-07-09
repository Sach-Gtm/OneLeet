const Test = require("../../models/testModel");
const Attempt = require("../../models/attemptModel");
// Registers the Question schema so populate("questions") / populate("answers.question")
// works at runtime (Test/Attempt only reference it by name).
require("../../models/questionModel");

// Roll a completed attempt into the user's denormalised dashboard stats.
async function applyAttemptToStats(user, { accuracy, durationTakenSeconds }) {
    if (!user.stats) user.stats = {};
    const prevTests = user.stats.testsTaken || 0;
    const prevAcc = user.stats.accuracy || 0;
    const newTests = prevTests + 1;

    user.stats.testsTaken = newTests;
    // running average accuracy across all attempts
    user.stats.accuracy = Math.round((prevAcc * prevTests + accuracy) / newTests);
    // keep 2-decimal precision so short tests don't round away to zero
    user.stats.studyHours =
        Math.round(((user.stats.studyHours || 0) + durationTakenSeconds / 3600) * 100) / 100;
    user.stats.overallPrep = Math.min(100, (user.stats.overallPrep || 0) + 3);

    // streak: consecutive calendar days with activity
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const last = user.stats.lastActiveAt ? new Date(user.stats.lastActiveAt) : null;
    if (!last) {
        user.stats.streak = 1;
    } else {
        const diffDays = Math.round((startOfDay(now) - startOfDay(last)) / 86400000);
        if (diffDays === 0) user.stats.streak = user.stats.streak || 1;
        else if (diffDays === 1) user.stats.streak = (user.stats.streak || 0) + 1;
        else user.stats.streak = 1;
    }
    user.stats.lastActiveAt = now;

    user.markModified("stats");
    await user.save();
}

// GET /api/tests — list available tests (no questions)
async function listTests(req, res, next) {
    try {
        const tests = await Test.find({ isPublished: true })
            .select("title description subject stateExam category durationMinutes questions totalMarks createdAt")
            .sort({ createdAt: -1 })
            .lean();

        const out = tests.map((t) => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            subject: t.subject,
            stateExam: t.stateExam,
            category: t.category,
            durationMinutes: t.durationMinutes,
            questionCount: (t.questions || []).length,
            totalMarks: t.totalMarks || (t.questions || []).length,
        }));
        return res.status(200).json({ success: true, tests: out });
    } catch (error) {
        next(error);
    }
}

// GET /api/tests/:id — fetch a test for TAKING (correct answers stripped)
async function getTest(req, res, next) {
    try {
        const test = await Test.findOne({ _id: req.params.id, isPublished: true }).populate({
            path: "questions",
            select: "text options subject topic difficulty marks", // NOT correctIndex/explanation
        });
        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        return res.status(200).json({
            success: true,
            test: {
                _id: test._id,
                title: test.title,
                description: test.description,
                subject: test.subject,
                durationMinutes: test.durationMinutes,
                questions: test.questions,
            },
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/tests/:id/submit — score, persist an attempt, update stats
async function submitTest(req, res, next) {
    try {
        const test = await Test.findById(req.params.id).populate({
            path: "questions",
            select: "text options correctIndex marks",
        });
        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        const submitted = Array.isArray(req.body?.answers) ? req.body.answers : [];
        const answerMap = new Map(submitted.map((a) => [String(a.questionId), a.selectedIndex]));

        let score = 0,
            correctCount = 0,
            incorrectCount = 0,
            unattemptedCount = 0,
            totalMarks = 0;

        const answers = test.questions.map((q) => {
            const marks = q.marks || 1;
            totalMarks += marks;
            const raw = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : null;

            if (raw === null || raw === undefined || raw === "") {
                unattemptedCount++;
                return { question: q._id, selectedIndex: null, correct: false };
            }
            const sel = Number(raw);
            const isCorrect = sel === q.correctIndex;
            if (isCorrect) {
                correctCount++;
                score += marks;
            } else {
                incorrectCount++;
            }
            return { question: q._id, selectedIndex: sel, correct: isCorrect };
        });

        const attempted = correctCount + incorrectCount;
        const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;

        const submittedAt = new Date();
        const startedAt = req.body?.startedAt ? new Date(req.body.startedAt) : submittedAt;
        const capSeconds = test.durationMinutes * 60;
        const durationTakenSeconds = Math.min(
            capSeconds,
            Math.max(0, Math.round((submittedAt - startedAt) / 1000))
        );

        const attempt = await Attempt.create({
            user: req.user._id,
            test: test._id,
            testTitle: test.title,
            answers,
            score,
            totalMarks,
            correctCount,
            incorrectCount,
            unattemptedCount,
            accuracy,
            durationTakenSeconds,
            startedAt,
            submittedAt,
        });

        await applyAttemptToStats(req.user, { accuracy, durationTakenSeconds });

        return res.status(201).json({
            success: true,
            attemptId: attempt._id,
            score,
            totalMarks,
            correctCount,
            incorrectCount,
            unattemptedCount,
            accuracy,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/attempts — the current user's attempt history
async function listAttempts(req, res, next) {
    try {
        const attempts = await Attempt.find({ user: req.user._id })
            .select("testTitle score totalMarks accuracy correctCount incorrectCount submittedAt")
            .sort({ submittedAt: -1 })
            .limit(20);
        return res.status(200).json({ success: true, attempts });
    } catch (error) {
        next(error);
    }
}

// GET /api/attempts/:id — full results breakdown (owner only)
async function getAttempt(req, res, next) {
    try {
        const attempt = await Attempt.findById(req.params.id)
            .populate({
                path: "answers.question",
                select: "text options correctIndex explanation subject topic difficulty marks",
            })
            .populate("test", "title durationMinutes");
        if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });
        if (String(attempt.user) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Not your attempt" });
        }
        return res.status(200).json({ success: true, attempt });
    } catch (error) {
        next(error);
    }
}

module.exports = { listTests, getTest, submitTest, listAttempts, getAttempt };
