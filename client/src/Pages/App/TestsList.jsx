import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ClipboardList,
    Clock,
    ListChecks,
    Play,
    Loader2,
    ChevronRight,
    GraduationCap,
    Dumbbell,
    Lock,
    CalendarClock,
    RotateCcw,
    Eye,
} from "lucide-react";
import { listTests, listAttempts } from "@/Api/TestsApi";
import { TEST_FORMATS, TEST_FORMAT_KEYS } from "@/lib/testFormats";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

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

// One test/practice card.
function TestCard({ t, onStart, onLocked, onResult }) {
    const practice = t.mode === "practice";
    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {t.subject && (
                    <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                        {t.subject}
                    </span>
                )}
                {t.format && TEST_FORMATS[t.format] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <span>{TEST_FORMATS[t.format].emoji}</span> {TEST_FORMATS[t.format].label}
                    </span>
                )}
                {t.premium && <PremiumBadge locked={t.locked} />}
                {t.attempted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ✓ Done
                    </span>
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
                <button
                    onClick={() => onLocked(t)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                    <Lock size={15} /> Unlock with Premium
                </button>
            ) : t.attempted && !practice ? (
                // Mock tests are single-attempt — once done, only the result is offered.
                <button
                    onClick={() => onResult(t.attemptId)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                    <Eye size={15} /> See Result
                </button>
            ) : t.attempted && practice ? (
                // Practice stays repeatable, with the last result one tap away.
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => onStart(t._id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <RotateCcw size={15} /> Practice again
                    </button>
                    <button
                        onClick={() => onResult(t.attemptId)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        <Eye size={15} /> Result
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

// The landing chooser — one big tile per mode. Picking one opens that list.
function ChooserTile({ icon, title, subtitle, count, accent, ring, onClick }) {
    const Icon = icon;
    return (
        <button
            onClick={onClick}
            className={
                "group flex items-center gap-4 rounded-2xl border-2 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md " +
                ring
            }
        >
            <span className={"grid h-14 w-14 shrink-0 place-items-center rounded-2xl " + accent}>
                <Icon size={26} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{count}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
            <ChevronRight className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5" size={20} />
        </button>
    );
}

// The compact top toggle shown once a mode is chosen (lets them switch).
function ModeToggle({ view, onChange, practiceCount, mockCount }) {
    const tab = (key, icon, label, count, activeCls) => {
        const Icon = icon;
        const active = view === key;
        return (
            <button
                onClick={() => onChange(key)}
                className={
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition " +
                    (active ? activeCls : "text-slate-500 hover:bg-slate-50")
                }
            >
                <Icon size={16} /> {label}
                <span className={"rounded-full px-1.5 text-xs font-bold " + (active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                    {count}
                </span>
            </button>
        );
    };
    return (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
            {tab("practice", Dumbbell, "Practice", practiceCount, "bg-emerald-600 text-white")}
            {tab("mock", GraduationCap, "Mock Tests", mockCount, "bg-indigo-600 text-white")}
        </div>
    );
}

export default function TestsList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState(null); // null (chooser) | "practice" | "mock"
    const [filter, setFilter] = useState("all");
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
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    const start = (id) => navigate(`/tests/${id}`);
    const result = (attemptId) => navigate(`/tests/result/${attemptId}`);
    const pick = (v) => {
        setView(v);
        setFilter("all");
    };

    const practiceTests = tests.filter((t) => t.mode === "practice");
    const mockTests = tests.filter((t) => t.mode !== "practice");
    const active = view === "practice" ? practiceTests : mockTests;
    const presentFormats = TEST_FORMAT_KEYS.filter((k) => active.some((t) => t.format === k));
    const shown = filter === "all" ? active : active.filter((t) => t.format === filter);

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tests &amp; Practice</h1>
                <p className="text-sm text-slate-500">
                    Practice sets reveal the answer as you go; mock tests are timed &amp; graded like the real exam.
                </p>
            </div>

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No tests available yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Your mentors&apos; tests and practice sets show up here.</p>
                </div>
            ) : view === null ? (
                // Step 1 — ask what they want to do.
                <div>
                    <p className="mb-4 text-sm font-semibold text-slate-700">What would you like to do?</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ChooserTile
                            icon={Dumbbell}
                            title="Practice"
                            subtitle="Learn as you go — the answer reveals the moment you pick one. Repeat any time."
                            count={practiceTests.length}
                            accent="bg-emerald-50 text-emerald-600"
                            ring="border-slate-200 hover:border-emerald-300"
                            onClick={() => pick("practice")}
                        />
                        <ChooserTile
                            icon={GraduationCap}
                            title="Mock Tests"
                            subtitle="Timed &amp; graded like the real exam. One attempt each, then review your result."
                            count={mockTests.length}
                            accent="bg-indigo-50 text-indigo-600"
                            ring="border-slate-200 hover:border-indigo-300"
                            onClick={() => pick("mock")}
                        />
                    </div>
                </div>
            ) : (
                // Step 2 — the chosen list, with a toggle to switch modes.
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <ModeToggle
                            view={view}
                            onChange={pick}
                            practiceCount={practiceTests.length}
                            mockCount={mockTests.length}
                        />
                        {presentFormats.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={
                                        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition " +
                                        (filter === "all"
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300")
                                    }
                                >
                                    All
                                </button>
                                {presentFormats.map((k) => {
                                    const f = TEST_FORMATS[k];
                                    return (
                                        <button
                                            key={k}
                                            onClick={() => setFilter(k)}
                                            title={`${f.label} — ${f.count} questions`}
                                            className={
                                                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition " +
                                                (filter === k
                                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300")
                                            }
                                        >
                                            <span>{f.emoji}</span> {f.tag || f.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {shown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                            <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-600">
                                {view === "practice" ? "No practice sets here yet" : "No mock tests here yet"}
                            </p>
                            {filter !== "all" && (
                                <button onClick={() => setFilter("all")} className="mt-1 text-xs font-semibold text-indigo-600 hover:underline">
                                    Show all
                                </button>
                            )}
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
                            <Link
                                key={a._id}
                                to={`/tests/result/${a._id}`}
                                className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50"
                            >
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
