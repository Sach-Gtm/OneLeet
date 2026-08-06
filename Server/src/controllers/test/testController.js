const Test = require("../../models/testModel");
const Attempt = require("../../models/attemptModel");
const { visibilityQuery } = require("../../config/exams");
const { STAFF, isPremiumUser } = require("../../config/roles");

const isStaff = (u) => STAFF.includes(u?.role);
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
        // Students see published tests targeted at the exams they're enrolled in
        // (zero enrollments → universal tests only); staff preview every exam's.
        const visible = isStaff(req.user) ? {} : visibilityQuery(req.user?.exams);
        const tests = await Test.find({ isPublished: true, ...visible })
            .select("title description subject topic stateExam targets category format mode premium durationMinutes questions totalMarks closeAt openAt createdAt")
            .sort({ createdAt: -1 })
            .lean();

        // Which of these has the student already attempted? Graded mock tests are
        // single-attempt, so the card shows "See result" instead of "Start". Keep
        // the latest attempt per test for the result link.
        // Index the student's latest attempt by BOTH the test's id and its title.
        // Matching on the (stable, unique) title as well means a test that was
        // re-seeded with a new _id still surfaces the earlier attempt, instead of
        // reverting the card to "Start".
        const latestByTest = new Map();
        const latestByTitle = new Map();
        if (req.user) {
            const attempts = await Attempt.find({ user: req.user._id })
                .select("test testTitle submittedAt")
                .sort({ submittedAt: -1 })
                .lean();
            for (const a of attempts) {
                const k = String(a.test);
                if (!latestByTest.has(k)) latestByTest.set(k, a._id);
                const tk = (a.testTitle || "").trim().toLowerCase();
                if (tk && !latestByTitle.has(tk)) latestByTitle.set(tk, a._id);
            }
        }

        // Premium items stay visible to everyone (shown locked); `locked` tells the
        // client to render the badge + upgrade prompt for a free student.
        const canPremium = isPremiumUser(req.user);
        const out = tests.map((t) => {
            const attemptId =
                latestByTest.get(String(t._id)) ||
                latestByTitle.get((t.title || "").trim().toLowerCase()) ||
                null;
            return {
                _id: t._id,
                title: t.title,
                description: t.description,
                subject: t.subject,
                topic: t.topic || null,
                stateExam: t.stateExam,
                targets: t.targets || [],
                category: t.category,
                format: t.format || null,
                mode: t.mode || "test",
                premium: !!t.premium,
                locked: !!t.premium && !canPremium,
                durationMinutes: t.durationMinutes,
                questionCount: (t.questions || []).length,
                totalMarks: t.totalMarks || (t.questions || []).length,
                // Deadline for the card. Practice sets (and mock tests without a
                // window) have no closeAt → the client shows "Lifetime access".
                closeAt: t.closeAt || null,
                attempted: !!attemptId,
                attemptId,
            };
        });
        return res.status(200).json({ success: true, tests: out });
    } catch (error) {
        next(error);
    }
}

// GET /api/tests/:id — fetch a test for TAKING. Graded tests hide the correct
// answers until submission; PRACTICE sets reveal the answer the moment the
// student picks an option, so it's safe (and necessary) to send them up front.
async function getTest(req, res, next) {
    try {
        const test = await Test.findOne({ _id: req.params.id, isPublished: true });
        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        // Premium gate: free students can see it in the list but not open it.
        if (test.premium && !isPremiumUser(req.user)) {
            return res.status(403).json({
                success: false,
                code: "PREMIUM_REQUIRED",
                message: "This is a Premium test. Upgrade to Premium to unlock it.",
            });
        }

        // Single-attempt: a graded mock test can only be taken once. If they've
        // already done it, send them to their result instead of a fresh attempt.
        // (Practice sets stay repeatable — drilling is the point.)
        if (test.mode === "test") {
            const prev = await Attempt.findOne({ user: req.user._id, test: test._id })
                .select("_id")
                .sort({ submittedAt: -1 })
                .lean();
            if (prev) {
                return res.status(403).json({
                    success: false,
                    code: "ALREADY_ATTEMPTED",
                    attemptId: prev._id,
                    message: "You've already taken this test. View your result.",
                });
            }
        }

        // Competitive window: a scheduled graded test can only be taken while open.
        if (test.mode === "test" && test.closeAt) {
            const now = Date.now();
            if (test.openAt && now < new Date(test.openAt).getTime()) {
                return res.status(403).json({
                    success: false,
                    message: "This test hasn't started yet.",
                    opensAt: test.openAt,
                });
            }
            if (now > new Date(test.closeAt).getTime()) {
                return res.status(403).json({
                    success: false,
                    message: "This test has closed.",
                    closedAt: test.closeAt,
                });
            }
        }

        const practice = test.mode === "practice";
        await test.populate({
            path: "questions",
            select: practice
                ? "text options subject topic difficulty marks correctIndex explanation"
                : "text options subject topic difficulty marks",
        });

        return res.status(200).json({
            success: true,
            test: {
                _id: test._id,
                title: test.title,
                description: test.description,
                subject: test.subject,
                mode: test.mode,
                durationMinutes: test.durationMinutes,
                openAt: test.openAt || null,
                closeAt: test.closeAt || null,
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
            select: "text options correctIndex explanation marks",
        });
        if (!test) return res.status(404).json({ success: false, message: "Test not found" });

        // Premium gate: a free student can't submit a premium test either.
        if (test.premium && !isPremiumUser(req.user)) {
            return res.status(403).json({
                success: false,
                code: "PREMIUM_REQUIRED",
                message: "This is a Premium test. Upgrade to Premium to unlock it.",
            });
        }

        // Single-attempt: never accept a second submission of a graded mock test.
        if (test.mode === "test") {
            const prev = await Attempt.findOne({ user: req.user._id, test: test._id }).select("_id").lean();
            if (prev) {
                return res.status(409).json({
                    success: false,
                    code: "ALREADY_ATTEMPTED",
                    attemptId: prev._id,
                    message: "You've already submitted this test.",
                });
            }
        }

        // Competitive window: reject submissions once the test has closed (a small
        // grace absorbs clock skew and requests already in flight at closeAt).
        if (
            test.mode === "test" &&
            test.closeAt &&
            Date.now() > new Date(test.closeAt).getTime() + 2 * 60 * 1000
        ) {
            return res.status(403).json({
                success: false,
                message: "This test has closed. Submissions are no longer accepted.",
            });
        }

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
            // Snapshot the question so the review is always viewable later.
            const snap = {
                question: q._id,
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
            };
            const raw = answerMap.has(String(q._id)) ? answerMap.get(String(q._id)) : null;

            if (raw === null || raw === undefined || raw === "") {
                unattemptedCount++;
                return { ...snap, selectedIndex: null, correct: false };
            }
            const sel = Number(raw);
            const isCorrect = sel === q.correctIndex;
            if (isCorrect) {
                correctCount++;
                score += marks;
            } else {
                incorrectCount++;
            }
            return { ...snap, selectedIndex: sel, correct: isCorrect };
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
            .select("test testTitle score totalMarks accuracy correctCount incorrectCount submittedAt")
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
            .populate("test", "title durationMinutes mode");
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
