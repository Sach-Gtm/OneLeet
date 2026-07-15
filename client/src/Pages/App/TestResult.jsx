import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    CheckCircle2,
    XCircle,
    MinusCircle,
    Clock,
    Target,
    Loader2,
    ArrowLeft,
    RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAttempt } from "@/Api/TestsApi";
import TestLeaderboardPanel from "@/Components/App/TestLeaderboardPanel";

const fmtDuration = (s = 0) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export default function TestResult() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getAttempt(attemptId)
            .then((res) => active && setAttempt(res.attempt))
            .catch(() => active && setAttempt(null))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [attemptId]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (!attempt) {
        return (
            <div className="mx-auto max-w-md py-16 text-center">
                <p className="text-sm font-medium text-slate-600">Result not found.</p>
                <Link to="/tests" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    Back to Tests
                </Link>
            </div>
        );
    }

    const summary = [
        { label: "Correct", value: attempt.correctCount, icon: CheckCircle2, color: "text-emerald-600" },
        { label: "Incorrect", value: attempt.incorrectCount, icon: XCircle, color: "text-red-500" },
        { label: "Skipped", value: attempt.unattemptedCount, icon: MinusCircle, color: "text-slate-400" },
    ];

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Results</p>
                <h1 className="text-2xl font-bold text-slate-900">{attempt.test?.title || attempt.testTitle}</h1>
            </div>

            {/* Score summary */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-indigo-100">Your score</p>
                        <p className="text-4xl font-extrabold">
                            {attempt.score}
                            <span className="text-2xl font-semibold text-indigo-200">/{attempt.totalMarks}</span>
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div>
                            <p className="flex items-center gap-1 text-2xl font-bold">
                                <Target size={18} /> {attempt.accuracy}%
                            </p>
                            <p className="text-xs text-indigo-200">Accuracy</p>
                        </div>
                        <div>
                            <p className="flex items-center gap-1 text-2xl font-bold">
                                <Clock size={18} /> {fmtDuration(attempt.durationTakenSeconds)}
                            </p>
                            <p className="text-xs text-indigo-200">Time taken</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 flex gap-3">
                    {summary.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm">
                                <Icon size={15} /> {s.value} {s.label}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Competitive leaderboard (frozen countdown → final board + celebration).
                Renders nothing for non-competitive tests. */}
            {attempt.test?._id && <TestLeaderboardPanel testId={attempt.test._id} />}

            {/* Review */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-800">Review</h2>
                {attempt.answers.map((a, i) => {
                    const q = a.question;
                    if (!q) return null;
                    return (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-slate-800">
                                    <span className="font-bold text-indigo-600">Q{i + 1}. </span>
                                    {q.text}
                                </p>
                                <span
                                    className={cn(
                                        "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                                        a.selectedIndex === null
                                            ? "bg-slate-100 text-slate-500"
                                            : a.correct
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-500"
                                    )}
                                >
                                    {a.selectedIndex === null ? "Skipped" : a.correct ? "Correct" : "Wrong"}
                                </span>
                            </div>
                            <div className="mt-3 space-y-2">
                                {q.options.map((opt, idx) => {
                                    const isCorrect = idx === q.correctIndex;
                                    const isChosen = a.selectedIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                                isCorrect
                                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                    : isChosen
                                                    ? "border-red-300 bg-red-50 text-red-700"
                                                    : "border-slate-200 text-slate-600"
                                            )}
                                        >
                                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[11px] font-bold">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            {opt}
                                            {isCorrect && <CheckCircle2 size={15} className="ml-auto text-emerald-600" />}
                                            {isChosen && !isCorrect && <XCircle size={15} className="ml-auto text-red-500" />}
                                        </div>
                                    );
                                })}
                            </div>
                            {q.explanation && (
                                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    <span className="font-semibold">Explanation: </span>
                                    {q.explanation}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => navigate("/tests")}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <ArrowLeft size={15} /> Back to Tests
                </button>
                {attempt.test?._id && (
                    <button
                        onClick={() => navigate(`/tests/${attempt.test._id}`)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <RotateCw size={15} /> Retake Test
                    </button>
                )}
            </div>
        </div>
    );
}
