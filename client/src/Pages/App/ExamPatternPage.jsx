import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ScrollText, Loader2, ArrowLeft, Target, ArrowRight, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getMyExamPatterns } from "@/Api/ExamPatternApi";
import { getSeatMatrixIndex } from "@/Api/SeatMatrixApi";
import { openCallback } from "@/lib/callback";
import PatternDetail from "@/Components/App/ExamPatternDetail";

// Stable empty reference so "no exams selected" doesn't churn a re-render.
const EMPTY = [];

// Dedicated page for the full exam paper pattern(s) — pattern, seat intake,
// colleges and more — for the exam(s) the student picked in their profile. The
// dashboard only links here (via a compact card), keeping itself uncluttered.
// A `?exam=<code>` query param deep-links to (and remembers) one exam.
export default function ExamPatternPage() {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [fetched, setFetched] = useState(null);
    // Which exams have a published seat matrix (to show the "Seat Matrix" button).
    const [matrixCodes, setMatrixCodes] = useState(() => new Set());

    const hasExams = (user?.exams?.length || 0) > 0;

    useEffect(() => {
        if (!hasExams) return; // "no exams" is derived below — no fetch, no setState churn
        let alive = true;
        getMyExamPatterns()
            .then((rows) => alive && setFetched(rows))
            .catch(() => alive && setFetched([]));
        getSeatMatrixIndex()
            .then((rows) => alive && setMatrixCodes(new Set(rows.map((r) => r.examCode))))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [hasExams]);

    // A student with no exams has no patterns (no fetch); otherwise it's whatever
    // we fetched (null while still loading).
    const patterns = hasExams ? fetched : EMPTY;

    // The chosen exam comes from ?exam=<code> when present, else the first one.
    const wantCode = params.get("exam");
    const activeIndex = useMemo(() => {
        if (!patterns || patterns.length === 0) return 0;
        const i = patterns.findIndex((p) => p.examCode === wantCode);
        return i >= 0 ? i : 0;
    }, [patterns, wantCode]);
    const current = patterns && patterns.length ? patterns[activeIndex] : null;

    const Header = (
        <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15">
                    <ScrollText size={18} />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Exam Paper Pattern</h1>
                    <p className="text-xs text-slate-400">Pattern, marking, seat intake &amp; colleges for your exam.</p>
                </div>
            </div>
        </div>
    );

    if (patterns === null) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                {Header}
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-4">
            {Header}

            {!hasExams ? (
                <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                >
                    <Target size={18} className="shrink-0 text-indigo-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Pick the LEET exams you&apos;re preparing for in your profile to see their full paper pattern &amp; seat intake here.
                    </p>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-indigo-400" />
                </Link>
            ) : patterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
                    <ScrollText className="mb-2 h-7 w-7 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pattern coming soon</p>
                    <p className="mt-0.5 max-w-sm text-xs text-slate-400">
                        We&apos;re preparing the detailed paper pattern &amp; seat intake for your exam. Have a question in the meantime?
                    </p>
                    <button
                        onClick={openCallback}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <PhoneCall size={13} /> Request a callback
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Exam switcher when the student picked more than one. */}
                    {patterns.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {patterns.map((p, i) => (
                                <button
                                    key={p._id}
                                    onClick={() => setParams({ exam: p.examCode }, { replace: true })}
                                    className={cn(
                                        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                                        i === activeIndex
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    )}
                                >
                                    {p.examName}
                                </button>
                            ))}
                        </div>
                    )}
                    {current && <PatternDetail p={current} hasMatrix={matrixCodes.has(current.examCode)} />}
                </div>
            )}
        </div>
    );
}
