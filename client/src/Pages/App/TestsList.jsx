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
} from "lucide-react";
import { listTests, listAttempts } from "@/Api/TestsApi";
import { TEST_FORMATS, TEST_FORMAT_KEYS } from "@/lib/testFormats";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";

// One test/practice card.
function TestCard({ t, onStart, onLocked }) {
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
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
            {t.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                    <ListChecks size={14} /> {t.questionCount} Qs
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock size={14} /> {t.durationMinutes} min
                </span>
            </div>
            {t.locked ? (
                <button
                    onClick={() => onLocked(t)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                    <Lock size={15} /> Unlock with Premium
                </button>
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

// One side of the split — a titled column of cards.
function Column({ title, subtitle, icon, accent, items, onStart, onLocked }) {
    const Icon = icon;
    return (
        <section>
            <div className="mb-3 flex items-center gap-2">
                <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-lg " + accent}>
                    <Icon size={16} />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-slate-800">
                        {title} <span className="font-medium text-slate-400">· {items.length}</span>
                    </h2>
                    <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
            </div>
            {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                    Nothing here yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {items.map((t) => (
                        <TestCard key={t._id} t={t} onStart={onStart} onLocked={onLocked} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function TestsList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [gate, setGate] = useState(null); // premium test a free student tapped

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
    // Only surface filter chips for modes that actually have tests.
    const presentFormats = TEST_FORMAT_KEYS.filter((k) => tests.some((t) => t.format === k));
    const shown = filter === "all" ? tests : tests.filter((t) => t.format === filter);
    const practice = shown.filter((t) => t.mode === "practice");
    const mock = shown.filter((t) => t.mode !== "practice");

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tests &amp; Practice</h1>
                <p className="text-sm text-slate-500">
                    Practice sets reveal the answer as you go; mock tests are timed &amp; graded like the real exam.
                </p>
            </div>

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

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No tests available yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Your mentors&apos; tests and practice sets show up here.</p>
                </div>
            ) : shown.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No tests in this mode yet</p>
                    <button onClick={() => setFilter("all")} className="mt-1 text-xs font-semibold text-indigo-600 hover:underline">
                        Show all tests
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Column
                        title="Practice"
                        subtitle="Learn as you go — the answer reveals instantly."
                        icon={Dumbbell}
                        accent="bg-emerald-50 text-emerald-600"
                        items={practice}
                        onStart={start}
                        onLocked={setGate}
                    />
                    <Column
                        title="Mock Tests"
                        subtitle="Timed &amp; graded, just like the real exam."
                        icon={GraduationCap}
                        accent="bg-indigo-50 text-indigo-600"
                        items={mock}
                        onStart={start}
                        onLocked={setGate}
                    />
                </div>
            )}

            <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.title} />

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
        </div>
    );
}
