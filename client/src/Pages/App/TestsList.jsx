import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ClipboardList,
    Clock,
    ListChecks,
    Play,
    Loader2,
    ChevronRight,
    ChevronDown,
    GraduationCap,
    Dumbbell,
    LayoutGrid,
    Lock,
    CalendarClock,
    RotateCcw,
    Eye,
    Info,
    X,
    SlidersHorizontal,
} from "lucide-react";
import { listTests, listAttempts } from "@/Api/TestsApi";
import { getExams } from "@/Api/ExamsApi";
import { TEST_FORMATS, TEST_FORMAT_KEYS } from "@/lib/testFormats";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const isUniversal = (t) => !t.targets?.length || t.targets.includes("all");
const inCollege = (t, c) => c === "all" || isUniversal(t) || (t.targets || []).includes(c);
// A "Real Mock Test" is a full-syllabus paper (every subject, real-exam format).
const isRealMock = (t) => t.category === "full-mock" || t.format === "real-exam";

// The exam's subjects — always offered in the Subject filter so students can pick
// theirs; any other subjects that appear on real tests merge in after these.
const SUBJECTS = ["Reasoning", "Mathematics", "Mechanics", "Physics", "Chemistry", "Computer Application"];

// Every card shows a deadline. No close date → the content is always available.
function Deadline({ closeAt }) {
    if (!closeAt) {
        return (
            <span className="inline-flex items-center gap-1 text-emerald-600">
                <CalendarClock size={14} /> Lifetime access
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-slate-500">
            <CalendarClock size={14} /> Ends {fmtDate(closeAt)}
        </span>
    );
}

function TestCard({ t, onStart, onLocked, onResult }) {
    const practice = t.mode === "practice";
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {t.subject && (
                    <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">{t.subject}</span>
                )}
                {t.format && TEST_FORMATS[t.format] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <span>{TEST_FORMATS[t.format].emoji}</span> {TEST_FORMATS[t.format].label}
                    </span>
                )}
                {t.premium && <PremiumBadge locked={t.locked} />}
                {t.attempted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">✓ Done</span>
                )}
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
            {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                    <ListChecks size={14} /> {t.questionCount} Qs
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> {t.durationMinutes} min
                </span>
                <Deadline closeAt={t.closeAt} />
            </div>

            {t.locked ? (
                <button onClick={() => onLocked(t)} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                    <Lock size={15} /> Unlock with Premium
                </button>
            ) : t.attempted && !practice ? (
                <button onClick={() => onResult(t.attemptId)} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                    <Eye size={15} /> See Result
                </button>
            ) : t.attempted && practice ? (
                // Already attempted a practice set → offer Retake or View Result.
                <div className="mt-4 flex gap-2">
                    <button onClick={() => onStart(t._id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                        <RotateCcw size={15} /> Retake
                    </button>
                    <button onClick={() => onResult(t.attemptId)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                        <Eye size={15} /> View Result
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => onStart(t._id)}
                    className={
                        "mt-4 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white transition " +
                        (practice ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700")
                    }
                >
                    <Play size={15} /> {practice ? "Start Practice" : "Start Test"}
                </button>
            )}
        </div>
    );
}

// Compact All / Practice / Mock switch.
function ModeToggle({ view, onChange, counts }) {
    const tab = (key, icon, label, activeCls) => {
        const Icon = icon;
        const active = view === key;
        return (
            <button
                onClick={() => onChange(key)}
                className={"inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition " + (active ? activeCls : "text-slate-500 hover:bg-slate-50")}
            >
                <Icon size={16} /> {label}
                <span className={"rounded-full px-1.5 text-xs font-bold " + (active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{counts[key]}</span>
            </button>
        );
    };
    return (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
            {tab("all", LayoutGrid, "All", "bg-slate-800 text-white")}
            {tab("practice", Dumbbell, "Practice", "bg-emerald-600 text-white")}
            {tab("mock", GraduationCap, "Mock Tests", "bg-indigo-600 text-white")}
        </div>
    );
}

// A styled native <select> so the filters are proper dropdowns.
function Select({ value, onChange, options }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 transition hover:border-indigo-300 focus:border-indigo-400 focus:outline-none"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
    );
}

export default function TestsList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [examList, setExamList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("all"); // "all" | "practice" | "mock"
    const [fFormat, setFFormat] = useState("all");
    const [fSubject, setFSubject] = useState("all");
    const [fCollege, setFCollege] = useState("all");
    const [fChapter, setFChapter] = useState("all");
    const [showHint, setShowHint] = useState(true);
    const [gate, setGate] = useState(null);

    useEffect(() => {
        let active = true;
        Promise.all([listTests(), listAttempts().catch(() => ({ attempts: [] }))])
            .then(([t, a]) => {
                if (!active) return;
                setTests(t.tests || []);
                setAttempts(a.attempts || []);
            })
            .catch(() => active && setTests([]))
            .finally(() => active && setLoading(false));
        getExams().then((e) => active && setExamList(e || [])).catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    // The filter hint pops up on open and dismisses itself after 3 seconds.
    useEffect(() => {
        const id = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(id);
    }, []);

    const examMap = useMemo(() => new Map((examList || []).map((e) => [e.code, e.name])), [examList]);

    const counts = useMemo(
        () => ({
            all: tests.length,
            practice: tests.filter((t) => t.mode === "practice").length,
            mock: tests.filter((t) => t.mode !== "practice").length,
        }),
        [tests]
    );

    const byMode = useMemo(
        () => (view === "all" ? tests : view === "practice" ? tests.filter((t) => t.mode === "practice") : tests.filter((t) => t.mode !== "practice")),
        [tests, view]
    );

    // Filter options derived from what's actually in the current mode.
    const formatOptions = useMemo(() => {
        const opts = [{ value: "all", label: "All formats" }];
        for (const k of TEST_FORMAT_KEYS) if (byMode.some((t) => t.format === k)) opts.push({ value: k, label: TEST_FORMATS[k].label });
        if (byMode.some(isRealMock)) opts.push({ value: "real-mock", label: "🎯 Real Mock Test" });
        return opts;
    }, [byMode]);
    const subjectOptions = useMemo(() => {
        const seen = [...SUBJECTS];
        for (const t of byMode) if (t.subject && !seen.includes(t.subject)) seen.push(t.subject);
        return [{ value: "all", label: "All subjects" }, ...seen.map((s) => ({ value: s, label: s }))];
    }, [byMode]);
    const collegeOptions = useMemo(() => {
        const codes = new Set();
        for (const t of byMode) for (const c of t.targets || []) if (c && c !== "all") codes.add(c);
        const order = new Map((examList || []).map((e, i) => [e.code, i]));
        const list = [...codes].sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9));
        return [{ value: "all", label: "All colleges" }, ...list.map((c) => ({ value: c, label: examMap.get(c) || c }))];
    }, [byMode, examList, examMap]);
    const chapterOptions = useMemo(() => {
        const seen = [];
        for (const t of byMode) if (t.topic && !seen.includes(t.topic)) seen.push(t.topic);
        seen.sort((a, b) => a.localeCompare(b));
        return [{ value: "all", label: "All chapters" }, ...seen.map((s) => ({ value: s, label: s }))];
    }, [byMode]);

    const shown = useMemo(
        () =>
            byMode.filter(
                (t) =>
                    (fFormat === "all" || (fFormat === "real-mock" ? isRealMock(t) : t.format === fFormat)) &&
                    (fSubject === "all" || t.subject === fSubject) &&
                    inCollege(t, fCollege) &&
                    (fChapter === "all" || t.topic === fChapter)
            ),
        [byMode, fFormat, fSubject, fCollege, fChapter]
    );

    const anyFilter = fFormat !== "all" || fSubject !== "all" || fCollege !== "all" || fChapter !== "all";
    const clearFilters = () => {
        setFFormat("all");
        setFSubject("all");
        setFCollege("all");
        setFChapter("all");
    };
    const pick = (v) => {
        setView(v);
        clearFilters();
    };

    const start = (id) => navigate(`/tests/${id}`);
    const result = (attemptId) => navigate(`/tests/result/${attemptId}`);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tests &amp; Practice</h1>
                <p className="text-sm text-slate-500">
                    Practice sets reveal the answer as you go; mock tests are timed &amp; graded like the real exam.
                </p>
            </div>

            {/* Self-dismissing hint (3s) nudging the filters. */}
            {showHint && tests.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
                    <span className="flex items-center gap-2">
                        <Info size={16} className="shrink-0" /> Tip: use the filters to narrow tests by subject, college or chapter.
                    </span>
                    <button onClick={() => setShowHint(false)} className="shrink-0 rounded-md p-1 text-indigo-500 hover:bg-indigo-100" aria-label="Dismiss">
                        <X size={15} />
                    </button>
                </div>
            )}

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No tests available yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Your mentors&apos; tests and practice sets show up here.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <ModeToggle view={view} onChange={pick} counts={counts} />
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                            {subjectOptions.length > 1 && <Select value={fSubject} onChange={setFSubject} options={subjectOptions} />}
                            {formatOptions.length > 1 && <Select value={fFormat} onChange={setFFormat} options={formatOptions} />}
                            {collegeOptions.length > 1 && <Select value={fCollege} onChange={setFCollege} options={collegeOptions} />}
                            {chapterOptions.length > 1 && <Select value={fChapter} onChange={setFChapter} options={chapterOptions} />}
                            {anyFilter && (
                                <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                                    <RotateCcw size={13} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {shown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                            <SlidersHorizontal className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">No tests match these filters</p>
                            <button onClick={clearFilters} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {shown.map((t) => (
                                <TestCard key={t._id} t={t} onStart={start} onLocked={setGate} onResult={result} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {attempts.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-bold text-slate-800">Your recent attempts</h2>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {attempts.slice(0, 6).map((a) => (
                            <Link key={a._id} to={`/tests/result/${a._id}`} className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{a.testTitle}</p>
                                    <p className="text-xs text-slate-400">
                                        Score {a.score}/{a.totalMarks} · {a.accuracy}% accuracy
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.title} />
        </div>
    );
}
