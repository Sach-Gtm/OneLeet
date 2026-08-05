import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ScrollText, Loader2, ArrowLeft, Target, ArrowRight, PhoneCall, ChevronDown, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getMyExamPatterns } from "@/Api/ExamPatternApi";
import { getSeatMatrixIndex } from "@/Api/SeatMatrixApi";
import { getCutoffIndex } from "@/Api/CutoffApi";
import { getExams } from "@/Api/ExamsApi";
import { openCallback } from "@/lib/callback";
import PatternDetail from "@/Components/App/ExamPatternDetail";

// Stable empty reference so "no exams selected" doesn't churn a re-render.
const EMPTY = [];
// What an "All LEET" student's exam filter opens on by default.
const DEFAULT_EXAM = "ipu-leet";

// Dedicated page for the full exam paper pattern(s) — pattern, seat intake,
// colleges and more — for the exam(s) the student picked in their profile. The
// dashboard only links here (via a compact card), keeping itself uncluttered.
// A `?exam=<code>` query param deep-links to (and remembers) one exam.
//   • Specific exams  → a pill switcher over just those exams.
//   • "All LEET"      → a filter over the whole catalog, opening on IPU, with a
//                        per-exam "coming soon" when that exam has no pattern yet.
export default function ExamPatternPage() {
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [fetched, setFetched] = useState(null);
    // Which exams have a published seat matrix / cut-offs (to show the buttons).
    const [matrixCodes, setMatrixCodes] = useState(() => new Set());
    const [cutoffCodes, setCutoffCodes] = useState(() => new Set());
    // The full LEET catalog — only needed to power the "All LEET" filter.
    const [catalog, setCatalog] = useState(null);

    const hasExams = (user?.exams?.length || 0) > 0;
    const isAll = Array.isArray(user?.exams) && user.exams.includes("all");

    useEffect(() => {
        if (!hasExams) return; // "no exams" is derived below — no fetch, no setState churn
        let alive = true;
        getMyExamPatterns()
            .then((rows) => alive && setFetched(rows))
            .catch(() => alive && setFetched([]));
        getSeatMatrixIndex()
            .then((rows) => alive && setMatrixCodes(new Set(rows.map((r) => r.examCode))))
            .catch(() => {});
        getCutoffIndex()
            .then((rows) => alive && setCutoffCodes(new Set(rows.map((r) => r.examCode))))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [hasExams]);

    // Load the catalog for the "All LEET" filter (grouped by region).
    useEffect(() => {
        if (!isAll) return;
        let alive = true;
        getExams()
            .then((e) => alive && setCatalog(e))
            .catch(() => alive && setCatalog([]));
        return () => {
            alive = false;
        };
    }, [isAll]);

    // A student with no exams has no patterns (no fetch); otherwise it's whatever
    // we fetched (null while still loading).
    const patterns = hasExams ? fetched : EMPTY;

    // The chosen exam: ?exam=<code> wins; else IPU for "All LEET", else the first
    // of the student's own patterns.
    const wantCode = params.get("exam") || (isAll ? DEFAULT_EXAM : patterns?.[0]?.examCode || "");
    const current = useMemo(
        () => (patterns || []).find((p) => p.examCode === wantCode) || null,
        [patterns, wantCode]
    );

    const catalogGroups = useMemo(() => {
        const map = new Map();
        for (const e of catalog || []) {
            if (!map.has(e.group)) map.set(e.group, []);
            map.get(e.group).push(e);
        }
        return [...map.entries()];
    }, [catalog]);

    const selectedName =
        current?.examName || (catalog || []).find((e) => e.code === wantCode)?.name || "this exam";

    const pick = (code) => setParams({ exam: code }, { replace: true });

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

    // "Coming soon" for a specific exam (or generic when none named).
    const comingSoon = (name) => (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
            <ScrollText className="mb-2 h-7 w-7 text-slate-300" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pattern coming soon</p>
            <p className="mt-0.5 max-w-sm text-xs text-slate-400">
                We&apos;re preparing the detailed paper pattern &amp; seat intake for{" "}
                {name ? <span className="font-semibold text-slate-500">{name}</span> : "your exam"}. Have a question in the meantime?
            </p>
            <button
                onClick={openCallback}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
                <PhoneCall size={13} /> Request a callback
            </button>
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
            ) : isAll ? (
                // "All LEET" → a filter over the whole catalog, opening on IPU.
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                        <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <ListFilter size={14} /> Choose exam
                        </span>
                        <div className="relative min-w-[15rem] flex-1 sm:flex-none">
                            <select
                                value={wantCode}
                                onChange={(e) => pick(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 focus:border-indigo-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            >
                                {catalog === null ? (
                                    <option>Loading…</option>
                                ) : (
                                    catalogGroups.map(([group, items]) => (
                                        <optgroup key={group} label={group}>
                                            {items.map((e) => (
                                                <option key={e.code} value={e.code}>
                                                    {e.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))
                                )}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <span
                            className={cn(
                                "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                current
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300"
                            )}
                        >
                            <span className={cn("h-1.5 w-1.5 rounded-full", current ? "bg-emerald-500" : "bg-slate-400")} />
                            {current ? "Pattern available" : "Coming soon"}
                        </span>
                    </div>
                    {current ? (
                        <PatternDetail
                            p={current}
                            hasMatrix={matrixCodes.has(current.examCode)}
                            hasCutoffs={cutoffCodes.has(current.examCode)}
                        />
                    ) : (
                        comingSoon(selectedName)
                    )}
                </div>
            ) : patterns.length === 0 ? (
                comingSoon()
            ) : (
                <div className="space-y-4">
                    {/* Exam switcher when the student picked more than one. */}
                    {patterns.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {patterns.map((p) => (
                                <button
                                    key={p._id}
                                    onClick={() => pick(p.examCode)}
                                    className={cn(
                                        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                                        p.examCode === wantCode
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    )}
                                >
                                    {p.examName}
                                </button>
                            ))}
                        </div>
                    )}
                    {(current || patterns[0]) && (
                        <PatternDetail
                            p={current || patterns[0]}
                            hasMatrix={matrixCodes.has((current || patterns[0]).examCode)}
                            hasCutoffs={cutoffCodes.has((current || patterns[0]).examCode)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
