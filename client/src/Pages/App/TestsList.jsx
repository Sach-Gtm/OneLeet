import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ClipboardList, Clock, ListChecks, Play, Loader2, ChevronRight, Lock,
    CalendarClock, RotateCcw, Eye, ArrowLeft, SlidersHorizontal, Check, X,
    Brain, Calculator, Cog, Atom, FlaskConical, Cpu, Target, Layers, GraduationCap,
} from "lucide-react";
import { listTests, listAttempts } from "@/Api/TestsApi";
import { getExams } from "@/Api/ExamsApi";
import { TEST_FORMATS, TEST_FORMAT_KEYS } from "@/lib/testFormats";
import { loadTestPrefs, saveTestPrefs, DEFAULT_TEST_PREFS } from "@/lib/testPrefs";
import { useAuth } from "@/context/AuthContext";
import { isStaff } from "@/lib/roles";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const isRealMock = (t) => t.category === "full-mock" || t.format === "real-exam";
const isUniversal = (t) => !t.targets?.length || t.targets.includes("all");

const SUBJECTS = ["Reasoning", "Mathematics", "Mechanics", "Physics", "Chemistry", "Computer Application"];
const SUBJECT_META = {
    Reasoning: { icon: Brain, tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" },
    Mathematics: { icon: Calculator, tint: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
    Mechanics: { icon: Cog, tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    Physics: { icon: Atom, tint: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
    Chemistry: { icon: FlaskConical, tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    "Computer Application": { icon: Cpu, tint: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
};
const DEFAULT_META = { icon: ListChecks, tint: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };

const MODE_LABEL = { all: "All tests", practice: "Practice", graded: "Live graded" };
const MODES = [
    { key: "all", label: "All tests" },
    { key: "practice", label: "Practice" },
    { key: "graded", label: "Live graded" },
];

const matchMode = (t, mode) => mode === "all" || (mode === "practice" ? t.mode === "practice" : t.mode !== "practice");
const matchFormat = (t, format) => format === "all" || t.format === format;

function Deadline({ closeAt }) {
    if (!closeAt) return <span className="inline-flex items-center gap-1 text-emerald-600"><CalendarClock size={14} /> Lifetime</span>;
    return <span className="inline-flex items-center gap-1 text-slate-500"><CalendarClock size={14} /> Ends {fmtDate(closeAt)}</span>;
}

function TestCard({ t, onStart, onLocked, onResult }) {
    const practice = t.mode === "practice";
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {t.format && TEST_FORMATS[t.format] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <span>{TEST_FORMATS[t.format].emoji}</span> {TEST_FORMATS[t.format].label}
                    </span>
                )}
                {t.premium && <PremiumBadge locked={t.locked} />}
                {t.attempted && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">✓ Done</span>}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.title}</h3>
            {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{t.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><ListChecks size={14} /> {t.questionCount} Qs</span>
                <span className="inline-flex items-center gap-1"><Clock size={14} /> {t.durationMinutes} min</span>
                <Deadline closeAt={t.closeAt} />
            </div>

            {t.locked ? (
                <button onClick={() => onLocked(t)} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
                    <Lock size={15} /> Unlock with Premium
                </button>
            ) : t.attempted && !practice ? (
                <button onClick={() => onResult(t.attemptId)} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Eye size={15} /> See Result
                </button>
            ) : t.attempted && practice ? (
                <div className="mt-4 flex gap-2">
                    <button onClick={() => onStart(t._id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                        <RotateCcw size={15} /> Retake
                    </button>
                    <button onClick={() => onResult(t.attemptId)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                        <Eye size={15} /> Result
                    </button>
                </div>
            ) : (
                <button onClick={() => onStart(t._id)} className={"mt-4 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white transition " + (practice ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700")}>
                    <Play size={15} /> {practice ? "Start Practice" : "Start Test"}
                </button>
            )}
        </div>
    );
}

function Tile({ icon, label, sub, count, tint, onClick }) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
            <span className={"grid h-11 w-11 place-items-center rounded-xl " + tint}>{icon}</span>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">{label}</h3>
            <p className="text-xs text-slate-400">{sub}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {count} test{count === 1 ? "" : "s"} <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
            </span>
        </button>
    );
}

const Chip = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={"rounded-lg border px-3 py-1.5 text-sm font-semibold transition " + (active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300")}
    >
        {children}
    </button>
);

// Mounted fresh each open, so state seeds from the current prefs without an effect.
function PrefsModal({ initial, formatKeys, onSave, onClose }) {
    const [mode, setMode] = useState(initial?.mode || "all");
    const [format, setFormat] = useState(initial?.format || "all");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Choose your tests</h3>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Pick how you want to practise — we&apos;ll remember it.</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Type</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {MODES.map((m) => <Chip key={m.key} active={mode === m.key} onClick={() => setMode(m.key)}>{m.label}</Chip>)}
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Format</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Chip active={format === "all"} onClick={() => setFormat("all")}>All formats</Chip>
                    {formatKeys.map((k) => (
                        <Chip key={k} active={format === k} onClick={() => setFormat(k)}>{TEST_FORMATS[k].emoji} {TEST_FORMATS[k].label}</Chip>
                    ))}
                </div>

                <button onClick={() => onSave({ mode, format })} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                    <Check size={16} /> Show tests
                </button>
            </div>
        </div>
    );
}

export default function TestsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const staff = isStaff(user);
    const exams = useMemo(() => user?.exams || [], [user]);
    const multiExam = !staff && exams.length >= 2;

    const [tests, setTests] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [examList, setExamList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gate, setGate] = useState(null);
    const [prefs, setPrefs] = useState(loadTestPrefs);
    // Which batch we're viewing. null = "pick a batch" (only shown when in 2+).
    const [activeExam, setActiveExam] = useState(() => (multiExam ? null : staff ? "" : exams[0] || ""));
    const [selected, setSelected] = useState(null); // subject | "__realmock__" | "__mixed__" | null
    const [modal, setModal] = useState({ open: false, pending: null });
    const [limit, setLimit] = useState(9);

    useEffect(() => {
        getExams().then((e) => setExamList(e || [])).catch(() => {});
        listAttempts().then((a) => setAttempts(a.attempts || [])).catch(() => {});
    }, []);
    const examMap = useMemo(() => new Map((examList || []).map((e) => [e.code, e.name])), [examList]);

    // (Re)load tests scoped to the active batch — universal content included, and
    // "attempted" flags scoped to this batch. null → all enrolled (for counts).
    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loader before each batch fetch
        setLoading(true);
        listTests(activeExam || undefined)
            .then((t) => active && setTests(t.tests || []))
            .catch(() => active && setTests([]))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [activeExam]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging on view/filter/batch change
    useEffect(() => setLimit(9), [selected, prefs, activeExam]);

    const eff = prefs || DEFAULT_TEST_PREFS;

    const { subjectMap, realMocks, mixed } = useMemo(() => {
        const map = new Map();
        const rm = [];
        const mx = [];
        for (const t of tests) {
            if (isRealMock(t)) rm.push(t);
            else if (t.subject) (map.get(t.subject) || map.set(t.subject, []).get(t.subject)).push(t);
            else mx.push(t);
        }
        return { subjectMap: map, realMocks: rm, mixed: mx };
    }, [tests]);

    const formatKeys = useMemo(
        () => TEST_FORMAT_KEYS.filter((k) => k !== "real-exam" && tests.some((t) => !isRealMock(t) && t.format === k)),
        [tests]
    );

    const subjectTiles = useMemo(() => {
        const present = [...subjectMap.keys()].sort((a, b) => {
            const ia = SUBJECTS.indexOf(a), ib = SUBJECTS.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        return present.map((s) => ({ key: s, count: subjectMap.get(s).filter((t) => matchMode(t, eff.mode) && matchFormat(t, eff.format)).length }));
    }, [subjectMap, eff]);

    const realMockCount = useMemo(() => realMocks.filter((t) => matchMode(t, eff.mode)).length, [realMocks, eff]);
    const mixedCount = useMemo(() => mixed.filter((t) => matchMode(t, eff.mode) && matchFormat(t, eff.format)).length, [mixed, eff]);

    const shown = useMemo(() => {
        if (!selected) return [];
        if (selected === "__realmock__") return realMocks.filter((t) => matchMode(t, eff.mode));
        const list = selected === "__mixed__" ? mixed : subjectMap.get(selected) || [];
        return list.filter((t) => matchMode(t, eff.mode) && matchFormat(t, eff.format));
    }, [selected, subjectMap, realMocks, mixed, eff]);

    const openTile = (key) => { if (!prefs) setModal({ open: true, pending: key }); else setSelected(key); };
    const saveModal = (p) => {
        setPrefs(p);
        saveTestPrefs(p);
        const pending = modal.pending;
        setModal({ open: false, pending: null });
        if (pending) setSelected(pending);
    };

    const start = (id) => navigate(`/tests/${id}${activeExam ? `?exam=${encodeURIComponent(activeExam)}` : ""}`);
    const result = (attemptId) => navigate(`/tests/result/${attemptId}`);
    const selectedLabel = selected === "__realmock__" ? "Real Mock Tests" : selected === "__mixed__" ? "Mixed sets" : selected;

    const recentAttempts = attempts.length > 0 && (
        <div>
            <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Your recent attempts</h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
                {attempts.slice(0, 6).map((a) => (
                    <Link key={a._id} to={`/tests/result/${a._id}`} className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.testTitle}</p>
                            <p className="text-xs text-slate-400">Score {a.score}/{a.totalMarks} · {a.accuracy}% accuracy</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </Link>
                ))}
            </div>
        </div>
    );

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

    // ── Level 0: pick a batch (only when enrolled in 2+ batches) ──
    if (multiExam && activeExam === null) {
        return (
            <div className="mx-auto max-w-6xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tests &amp; Practice</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">You&apos;re in {exams.length} batches — pick one to see its tests. Shared content shows fresh in every batch.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {exams.map((code) => {
                        const count = tests.filter((t) => isUniversal(t) || t.targets.includes(code)).length;
                        return (
                            <Tile key={code} icon={<GraduationCap size={22} />} label={examMap.get(code) || code} sub="Your batch" count={count} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" onClick={() => { setActiveExam(code); setSelected(null); }} />
                        );
                    })}
                </div>
                {recentAttempts}
                {modal.open && <PrefsModal initial={prefs} formatKeys={formatKeys} onSave={saveModal} onClose={() => setModal({ open: false, pending: null })} />}
                <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.title} />
            </div>
        );
    }

    // ── Within a batch (or single-exam / staff): subject tiles → tests ──
    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    {multiExam && (
                        <button onClick={() => { setActiveExam(null); setSelected(null); }} className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                            <ArrowLeft size={15} /> All batches
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tests &amp; Practice</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activeExam ? (examMap.get(activeExam) || "This batch") + " · " : ""}practice reveals answers as you go; graded tests are timed &amp; ranked.
                    </p>
                </div>
                {prefs && (
                    <button onClick={() => setModal({ open: true, pending: null })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <SlidersHorizontal size={15} /> {MODE_LABEL[eff.mode]} · {eff.format === "all" ? "All formats" : TEST_FORMATS[eff.format]?.label}
                        <span className="text-indigo-600 dark:text-indigo-400">Change</span>
                    </button>
                )}
            </div>

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No tests available yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Your mentors&apos; tests and practice sets show up here.</p>
                </div>
            ) : selected ? (
                <div className="space-y-4">
                    <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                        <ArrowLeft size={15} /> All subjects
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedLabel}</h2>
                    {shown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-700">
                            <SlidersHorizontal className="mb-2 h-7 w-7 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No {MODE_LABEL[eff.mode].toLowerCase()} tests here for this format</p>
                            <button onClick={() => setModal({ open: true, pending: null })} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">Change filters</button>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-slate-400">Showing {Math.min(limit, shown.length)} of {shown.length} test{shown.length === 1 ? "" : "s"}</p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {shown.slice(0, limit).map((t) => (
                                    <TestCard key={t._id} t={t} onStart={start} onLocked={setGate} onResult={result} />
                                ))}
                            </div>
                            {shown.length > limit && (
                                <div className="flex justify-center pt-1">
                                    <button onClick={() => setLimit((l) => l + 9)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                        Show more <span className="text-slate-400">({shown.length - limit} left)</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subjectTiles.map((s) => {
                            const meta = SUBJECT_META[s.key] || DEFAULT_META;
                            const Icon = meta.icon;
                            return <Tile key={s.key} icon={<Icon size={22} />} label={s.key} sub="Chapter & topic tests" count={s.count} tint={meta.tint} onClick={() => openTile(s.key)} />;
                        })}
                        {mixedCount > 0 && (
                            <Tile icon={<Layers size={22} />} label="Mixed sets" sub="Cross-topic practice" count={mixedCount} tint={DEFAULT_META.tint} onClick={() => openTile("__mixed__")} />
                        )}
                        {realMockCount > 0 && (
                            <Tile icon={<Target size={22} />} label="Real Mock Tests" sub="Full-length · 100 Q" count={realMockCount} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" onClick={() => openTile("__realmock__")} />
                        )}
                    </div>
                    {recentAttempts}
                </>
            )}

            {modal.open && (
                <PrefsModal initial={prefs} formatKeys={formatKeys} onSave={saveModal} onClose={() => setModal({ open: false, pending: null })} />
            )}
            <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.title} />
        </div>
    );
}
