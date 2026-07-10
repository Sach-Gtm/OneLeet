import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getTest, submitTest } from "@/Api/TestsApi";

const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function TestTake() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [answers, setAnswers] = useState({});
    const [started, setStarted] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const startedAtRef = useRef(null);
    const submitRef = useRef(null);
    const submittedRef = useRef(false);

    useEffect(() => {
        let active = true;
        getTest(id)
            .then((res) => {
                if (!active) return;
                setTest(res.test);
                setSecondsLeft((res.test.durationMinutes || 30) * 60);
                startedAtRef.current = new Date().toISOString();
                setStarted(true);
            })
            .catch(() => active && setNotFound(true))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id]);

    const handleSubmit = async () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        try {
            const payload = {
                startedAt: startedAtRef.current,
                answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
                    questionId,
                    selectedIndex,
                })),
            };
            const res = await submitTest(id, payload);
            navigate(`/tests/result/${res.attemptId}`, { replace: true });
        } catch {
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

    // countdown
    useEffect(() => {
        if (!started) return undefined;
        const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(t);
    }, [started]);

    // auto-submit when time runs out
    useEffect(() => {
        if (started && secondsLeft === 0) submitRef.current?.();
    }, [started, secondsLeft]);

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
        <div className="mx-auto max-w-3xl pb-24">
            {/* Sticky header */}
            <div className="sticky top-[57px] z-20 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:top-[61px]">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold text-slate-900">{test.title}</h1>
                        <p className="text-xs text-slate-500">
                            {answeredCount}/{test.questions.length} answered
                        </p>
                    </div>
                    <div
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums",
                            lowTime ? "bg-red-50 text-red-600" : "bg-white text-slate-700 ring-1 ring-slate-200"
                        )}
                    >
                        <Clock size={15} /> {fmt(secondsLeft)}
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={submitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        Submit
                    </button>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {test.questions.map((q, i) => (
                    <div key={q._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex gap-2">
                            <span className="text-sm font-bold text-indigo-600">Q{i + 1}.</span>
                            <p className="text-sm font-medium text-slate-800">{q.text}</p>
                        </div>
                        <div className="mt-3 space-y-2">
                            {q.options.map((opt, idx) => {
                                const selected = answers[q._id] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setAnswers((a) => ({ ...a, [q._id]: idx }))}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                                            selected
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                                                selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 text-slate-400"
                                            )}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirm submit */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowConfirm(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-500">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Submit test?</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            You've answered {answeredCount} of {test.questions.length} questions. You can't
                            change answers after submitting.
                        </p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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
