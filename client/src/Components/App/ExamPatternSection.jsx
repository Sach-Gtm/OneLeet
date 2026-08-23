import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScrollText, Target, ArrowRight, PhoneCall } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMyExamPatterns } from "@/Api/ExamPatternApi";
import { openCallback } from "@/lib/callback";
import { ExamPatternCard } from "@/Components/App/ExamPatternDetail";

// Stable empty reference so "no exams selected" doesn't churn a re-render.
const EMPTY = [];

// Dashboard widget: a COMPACT entry point to each exam's paper pattern — just
// the blue identity card, one per exam the student picked. The full pattern
// (marking, section-wise structure, seat intake, colleges …) lives on the
// dedicated /exam-pattern page, so the dashboard stays uncluttered. Clicking a
// card deep-links straight to that exam's full page.
export default function ExamPatternSection() {
    const { user } = useAuth();
    const [fetched, setFetched] = useState(null);

    const hasExams = (user?.exams?.length || 0) > 0;

    useEffect(() => {
        if (!hasExams) return; // "no exams" is derived below, no fetch, no setState churn
        let alive = true;
        getMyExamPatterns()
            .then((rows) => alive && setFetched(rows))
            .catch(() => alive && setFetched([]));
        return () => {
            alive = false;
        };
    }, [hasExams]);

    const patterns = hasExams ? fetched : EMPTY;

    // Never show anything until we know the outcome (keeps the dashboard calm).
    if (patterns === null) return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <ScrollText size={16} />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-slate-800">Exam Paper Pattern</h2>
                    <p className="text-xs text-slate-400">Tap your exam to see its full pattern, seat intake &amp; colleges.</p>
                </div>
            </div>

            {!hasExams ? (
                <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                >
                    <Target size={18} className="shrink-0 text-indigo-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Pick the LEET exams you&apos;re preparing for in your profile to see their full paper pattern here.
                    </p>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-indigo-400" />
                </Link>
            ) : patterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center dark:border-slate-700">
                    <ScrollText className="mb-2 h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pattern coming soon</p>
                    <p className="mt-0.5 max-w-sm text-xs text-slate-400">
                        We&apos;re preparing the detailed paper pattern for your exam. Have a question in the meantime?
                    </p>
                    <button
                        onClick={openCallback}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <PhoneCall size={13} /> Request a callback
                    </button>
                </div>
            ) : (
                // One compact card per chosen exam.
                <div className="space-y-3">
                    {patterns.map((p) => (
                        <ExamPatternCard key={p._id} p={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
