import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Clock, Loader2, AlertTriangle, Flag, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getTest, submitTest } from "@/Api/TestsApi";
import { track } from "@/lib/telemetry";
import { useAuth } from "@/context/AuthContext";
import { isStaff } from "@/lib/roles";
import ProtectedContent from "@/Components/Security/ProtectedContent";
import TestPalette from "@/Components/App/TestPalette";

const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function TestTake() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const exam = searchParams.get("exam") || ""; // batch context (per-batch attempts)
    const navigate = useNavigate();
    const { user } = useAuth();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [answers, setAnswers] = useState({});
    const [started, setStarted] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [marked, setMarked] = useState({}); // questionId -> flagged for review
    const [currentQ, setCurrentQ] = useState(0); // which question is in view (palette highlight)
    const [flashQ, setFlashQ] = useState(null); // briefly ring a question after a jump
    const [paletteOpen, setPaletteOpen] = useState(false); // mobile bottom sheet

    const questionRefs = useRef([]);
    const startedAtRef = useRef(null);
    const submitRef = useRef(null);
    const submittedRef = useRef(false);

    useEffect(() => {
        let active = true;
        getTest(id, exam)
            .then((res) => {
                if (!active) return;
                setTest(res.test);
                setSecondsLeft((res.test.durationMinutes || 30) * 60);
                startedAtRef.current = new Date().toISOString();
                setStarted(true);
                track("first_test_start"); // funnel: opened a test (audit C3)
            })
            .catch((err) => {
                if (!active) return;
                const data = err?.response?.data || {};
                // A free student who reached a premium test by direct URL: nudge to upgrade.
                if (data.code === "PREMIUM_REQUIRED") {
                    toast.error("This is a Premium test. Upgrade to Premium to unlock it.");
                    navigate("/tests", { replace: true });
                    return;
                }
                // Already taken this single-attempt mock test: show the existing result.
                if (data.code === "ALREADY_ATTEMPTED") {
                    toast("You've already taken this test — here's your result.");
                    navigate(data.attemptId ? `/tests/result/${data.attemptId}` : "/tests", { replace: true });
                    return;
                }
                setNotFound(true);
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id, exam, navigate]);

    const handleSubmit = async () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        try {
            const payload = {
                startedAt: startedAtRef.current,
                examCode: exam, // record which batch this attempt was taken under
                answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
                    questionId,
                    selectedIndex,
                })),
            };
            const res = await submitTest(id, payload);
            track("first_test_done"); // funnel: completed a test (audit C3)
            navigate(`/tests/result/${res.attemptId}`, { replace: true });
        } catch (err) {
            // Raced a second submit of a single-attempt test: go to the first result.
            const data = err?.response?.data || {};
            if (data.code === "ALREADY_ATTEMPTED" && data.attemptId) {
                navigate(`/tests/result/${data.attemptId}`, { replace: true });
                return;
            }
            submittedRef.current = false;
            setSubmitting(false);
            toast.error("Could not submit the test. Please try again.");
        }
    };

    // keep the ref pointing at the latest handleSubmit (fresh `answers` closure)
    // so the auto-submit timer always calls the current version
    useEffect(() => {
        submitRef.current = handleSubmit;
    });

    const isPractice = test?.mode === "practice";

    // countdown (graded tests only — practice is self-paced)
    useEffect(() => {
        if (!started || isPractice) return undefined;
        const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [started, isPractice]);

    // auto-submit when time runs out (never for practice)
    useEffect(() => {
        if (started && secondsLeft === 0 && !isPractice) submitRef.current?.();
    }, [started, secondsLeft, isPractice]);

    // Jump to a question from the palette: scroll it into view and flash a ring
    // so the eye lands on it (real-exam navigator, audit H2).
    const jumpTo = (i) => {
        const el = questionRefs.current[i];
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentQ(i);
        setFlashQ(i);
        setPaletteOpen(false);
        window.setTimeout(() => setFlashQ((f) => (f === i ? null : f)), 1200);
    };

    const toggleMark = (qid) => setMarked((m) => ({ ...m, [qid]: !m[qid] }));

    // Keep the palette's "current" cell in sync with what you're scrolled to, so
    // it feels live. Graded tests only (practice has no palette).
    useEffect(() => {
        if (isPractice || !test) return undefined;
        const els = questionRefs.current.filter(Boolean);
        if (!els.length) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (!visible.length) return;
                const top = visible.reduce((a, b) =>
                    a.boundingClientRect.top < b.boundingClientRect.top ? a : b
                );
                const idx = els.indexOf(top.target);
                if (idx >= 0) setCurrentQ(idx);
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [isPractice, test]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (notFound || !test) {
        return (
            <div className="mx-auto max-w-md py-16 text-center">
                <p className="text-sm font-medium text-slate-600">This test could not be loaded.</p>
                <button
                    onClick={() => navigate("/tests")}
                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    Back to Tests
                </button>
            </div>
        );
    }

    const answeredCount = Object.keys(answers).length;
    const lowTime = secondsLeft <= 60;

    return (
        <div className={cn("mx-auto pb-24", isPractice ? "max-w-3xl" : "max-w-5xl")}>
            {/* Sticky header */}
            <div className="sticky top-[57px] z-20 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:top-[61px]">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{test.title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {isPractice
                                ? "Practice — the answer reveals as you go"
                                : `${answeredCount}/${test.questions.length} answered`}
                        </p>
                    </div>
                    {isPractice ? (
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-600">
                            Practice
                        </span>
                    ) : (
                        <div
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums",
                                lowTime
                                    ? "bg-red-50 text-red-600 dark:bg-red-500/15"
                                    : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                            )}
                        >
                            <Clock size={15} /> {fmt(secondsLeft)}
                        </div>
                    )}
                    {isPractice ? (
                        <button
                            onClick={() => (answeredCount > 0 ? handleSubmit() : navigate("/tests"))}
                            disabled={submitting}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {submitting ? "Saving…" : "Finish"}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            Submit
                        </button>
                    )}
                </div>
            </div>

            {/* Questions + real-exam palette navigator (audit H2) */}
            <div className="lg:flex lg:items-start lg:gap-6">
            <div className="min-w-0 lg:flex-1">
            <ProtectedContent
                enabled={Boolean(test.premium) && !isStaff(user)}
                contentType="test"
                contentRef={test.title || test._id || ""}
            >
            <div className="space-y-4">
                {test.questions.map((q, i) => (
                    <div
                        key={q._id}
                        ref={(el) => (questionRefs.current[i] = el)}
                        className={cn(
                            "scroll-mt-28 rounded-2xl border bg-white p-5 transition dark:bg-slate-900",
                            flashQ === i
                                ? "border-indigo-400 ring-2 ring-indigo-300 dark:border-indigo-500"
                                : "border-slate-200 dark:border-slate-700"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-2">
                                <span className="text-sm font-bold text-indigo-600">Q{i + 1}.</span>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{q.text}</p>
                            </div>
                            {!isPractice && (
                                <button
                                    onClick={() => toggleMark(q._id)}
                                    className={cn(
                                        "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                                        marked[q._id]
                                            ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                                            : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    aria-pressed={!!marked[q._id]}
                                >
                                    <Flag size={12} className={marked[q._id] ? "fill-violet-500" : ""} />
                                    {marked[q._id] ? "Marked" : "Review"}
                                </button>
                            )}
                        </div>
                        <div className="mt-3 space-y-2">
                            {q.options.map((opt, idx) => {
                                const selected = answers[q._id] === idx;
                                const revealed = isPractice && answers[q._id] != null;
                                const isCorrect = idx === q.correctIndex;
                                let box =
                                    "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
                                let badge = "border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500";
                                if (revealed) {
                                    if (isCorrect) {
                                        box = "border-emerald-400 bg-emerald-50 text-emerald-800";
                                        badge = "border-emerald-500 bg-emerald-500 text-white";
                                    } else if (selected) {
                                        box = "border-red-300 bg-red-50 text-red-700";
                                        badge = "border-red-400 bg-red-400 text-white";
                                    } else {
                                        box = "border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500";
                                        badge = "border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600";
                                    }
                                } else if (selected) {
                                    box = "border-indigo-500 bg-indigo-50 text-indigo-800";
                                    badge = "border-indigo-500 bg-indigo-500 text-white";
                                }
                                return (
                                    <button
                                        key={idx}
                                        disabled={revealed}
                                        onClick={() => {
                                            if (!revealed) setAnswers((a) => ({ ...a, [q._id]: idx }));
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                                            box
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                                                badge
                                            )}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {isPractice && answers[q._id] != null && (
                            <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <span
                                    className={cn(
                                        "font-semibold",
                                        answers[q._id] === q.correctIndex ? "text-emerald-600" : "text-red-500"
                                    )}
                                >
                                    {answers[q._id] === q.correctIndex ? "Correct! " : "Not quite. "}
                                </span>
                                {q.explanation
                                    ? q.explanation
                                    : `The correct answer is ${String.fromCharCode(65 + q.correctIndex)}.`}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            </ProtectedContent>
            </div>

            {/* Desktop palette rail */}
            {!isPractice && (
                <aside className="hidden shrink-0 lg:block lg:w-60">
                    <div className="sticky top-[104px]">
                        <TestPalette
                            questions={test.questions}
                            answers={answers}
                            marked={marked}
                            current={currentQ}
                            onJump={jumpTo}
                        />
                    </div>
                </aside>
            )}
            </div>

            {/* Mobile: floating palette button + bottom sheet */}
            {!isPractice && (
                <>
                    <button
                        onClick={() => setPaletteOpen(true)}
                        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 lg:hidden"
                    >
                        <LayoutGrid size={16} /> {answeredCount}/{test.questions.length}
                    </button>
                    {paletteOpen && (
                        <div className="fixed inset-0 z-[70] lg:hidden">
                            <div
                                className="absolute inset-0 bg-slate-900/40"
                                onClick={() => setPaletteOpen(false)}
                            />
                            <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-3 dark:bg-slate-900">
                                <TestPalette
                                    questions={test.questions}
                                    answers={answers}
                                    marked={marked}
                                    current={currentQ}
                                    onJump={jumpTo}
                                    onClose={() => setPaletteOpen(false)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Confirm submit */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
                        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-500/15">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submit test?</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            You've answered {answeredCount} of {test.questions.length} questions. You can't
                            change answers after submitting.
                        </p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Keep going
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {submitting ? "Submitting…" : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
