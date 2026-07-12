import { useEffect, useState } from "react";
import {
    Wand2,
    Gauge,
    BarChart3,
    CalendarDays,
    Loader2,
    Sparkles,
    Lightbulb,
    Target,
    ChevronRight,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
    getAiStatus,
    generateQuestions,
    predictDifficulty,
    analyzePerformance,
    generateStudyPlan,
} from "@/Api/AiApi";

const TOOLS = [
    { key: "questions", label: "Question Gen", icon: Wand2 },
    { key: "predictor", label: "Predictor", icon: Gauge },
    { key: "analyzer", label: "Analyzer", icon: BarChart3 },
    { key: "planner", label: "Study Plan", icon: CalendarDays },
];

const DIFF_STYLE = {
    easy: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    hard: "bg-red-50 text-red-700",
};

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            {children}
        </label>
    );
}

const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function RunButton({ loading, children, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={15} />}
            {children}
        </button>
    );
}

/* ---------------- Question Generator ---------------- */
function QuestionGen() {
    const [form, setForm] = useState({ subject: "Digital Electronics", topic: "Logic Gates", difficulty: "easy", count: 5 });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    // answers[i] = the option index the user picked for question i (undefined
    // until they answer — each question locks after the first pick).
    const [answers, setAnswers] = useState({});

    const run = async () => {
        setLoading(true);
        setResult(null);
        setAnswers({});
        try {
            setResult(await generateQuestions(form));
        } catch {
            toast.error("Could not generate questions.");
        } finally {
            setLoading(false);
        }
    };

    const pick = (qi, idx) =>
        setAnswers((a) => (a[qi] !== undefined ? a : { ...a, [qi]: idx }));

    const answeredCount = Object.keys(answers).length;
    const correctCount = result
        ? Object.entries(answers).filter(
              ([qi, sel]) => result.questions[qi] && sel === result.questions[qi].answerIndex
          ).length
        : 0;

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Subject">
                    <input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </Field>
                <Field label="Topic">
                    <input className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                </Field>
                <Field label="Difficulty">
                    <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                    </select>
                </Field>
                <Field label="Count">
                    <select className={inputCls} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}>
                        {[3, 5, 10, 15, 20].map((n) => (
                            <option key={n} value={n}>{n} questions</option>
                        ))}
                    </select>
                </Field>
            </div>
            <RunButton loading={loading} onClick={run}>Generate {form.count} Questions</RunButton>

            {result && (
                <div className="space-y-3">
                    {/* Live score bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5">
                        <p className="text-sm font-semibold text-indigo-800">
                            Tap an option to answer — instant marking.
                        </p>
                        <span className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            answeredCount === result.questions.length
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-indigo-700 ring-1 ring-indigo-200"
                        )}>
                            {answeredCount === result.questions.length
                                ? `Score: ${correctCount} / ${result.questions.length}`
                                : `${correctCount} correct · ${answeredCount}/${result.questions.length} answered`}
                        </span>
                    </div>

                    {result.questions.map((q, i) => {
                        const sel = answers[i]; // undefined until answered
                        const answered = sel !== undefined;
                        return (
                            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-800">
                                        <span className="font-bold text-indigo-600">Q{i + 1}. </span>{q.question}
                                    </p>
                                    {q.difficulty && (
                                        <span className={cn("shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase", DIFF_STYLE[q.difficulty] || DIFF_STYLE.moderate)}>
                                            {q.difficulty}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                    {(q.options || []).map((opt, idx) => {
                                        const isCorrect = idx === q.answerIndex;
                                        const isPicked = sel === idx;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => pick(i, idx)}
                                                disabled={answered}
                                                className={cn(
                                                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                                                    !answered &&
                                                        "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer",
                                                    answered && isCorrect &&
                                                        "border-emerald-400 bg-emerald-50 font-semibold text-emerald-800",
                                                    answered && isPicked && !isCorrect &&
                                                        "border-red-300 bg-red-50 text-red-700",
                                                    answered && !isPicked && !isCorrect &&
                                                        "border-slate-100 text-slate-400"
                                                )}
                                            >
                                                <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                                                {answered && isCorrect && <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
                                                {answered && isPicked && !isCorrect && <XCircle size={16} className="shrink-0 text-red-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {answered && (
                                    <p className={cn(
                                        "mt-2.5 rounded-lg px-3 py-2 text-xs font-medium",
                                        sel === q.answerIndex
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-red-50 text-red-700"
                                    )}>
                                        {sel === q.answerIndex
                                            ? "✓ Correct — well done!"
                                            : `✗ Not quite. The correct answer is ${String.fromCharCode(65 + q.answerIndex)}. ${q.options?.[q.answerIndex] ?? ""}`}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ---------------- Difficulty Predictor ---------------- */
function Predictor() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const run = async () => {
        if (!text.trim()) return toast.error("Paste a question first.");
        setLoading(true);
        setResult(null);
        try {
            setResult(await predictDifficulty({ questionText: text }));
        } catch {
            toast.error("Could not predict difficulty.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <Field label="Question text">
                <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste a question to estimate its difficulty…"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </Field>
            <RunButton loading={loading} onClick={run}>Predict Difficulty</RunButton>
            {result && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <span className={cn("rounded-md px-3 py-1 text-sm font-bold uppercase", DIFF_STYLE[result.difficulty] || DIFF_STYLE.moderate)}>
                            {result.difficulty}
                        </span>
                        {typeof result.confidence === "number" && (
                            <span className="text-xs text-slate-400">{Math.round(result.confidence * 100)}% confidence</span>
                        )}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{result.rationale}</p>
                </div>
            )}
        </div>
    );
}

/* ---------------- Performance Analyzer ---------------- */
function Analyzer() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const run = async () => {
        setLoading(true);
        setResult(null);
        try {
            setResult(await analyzePerformance());
        } catch {
            toast.error("Could not analyze performance.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <p className="text-sm text-slate-500">Analyse your test history to surface weak areas and next steps.</p>
            <RunButton loading={loading} onClick={run}>Analyze my performance</RunButton>
            {result && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-700">{result.summary}</p>
                    {result.focusAreas?.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Focus areas</p>
                            <div className="flex flex-wrap gap-2">
                                {result.focusAreas.map((f) => (
                                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                                        <Target size={12} /> {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {result.recommendations?.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Recommendations</p>
                            <ul className="space-y-1.5">
                                {result.recommendations.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" /> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ---------------- Study Planner ---------------- */
function Planner() {
    const [form, setForm] = useState({ days: 7, hoursPerDay: 2, weakAreas: "" });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const run = async () => {
        setLoading(true);
        setResult(null);
        try {
            const weakAreas = form.weakAreas.split(",").map((s) => s.trim()).filter(Boolean);
            setResult(await generateStudyPlan({ days: form.days, hoursPerDay: form.hoursPerDay, weakAreas }));
        } catch {
            toast.error("Could not generate a plan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Days">
                    <input type="number" min={1} max={30} className={inputCls} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
                </Field>
                <Field label="Hours / day">
                    <input type="number" min={1} max={12} className={inputCls} value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: Number(e.target.value) })} />
                </Field>
                <Field label="Weak areas (comma-separated)">
                    <input className={inputCls} value={form.weakAreas} placeholder="Thermodynamics, K-Maps" onChange={(e) => setForm({ ...form, weakAreas: e.target.value })} />
                </Field>
            </div>
            <RunButton loading={loading} onClick={run}>Generate Study Plan</RunButton>
            {result && (
                <div className="space-y-3">
                    {result.summary && <p className="text-sm text-slate-600">{result.summary}</p>}
                    <div className="grid gap-3 sm:grid-cols-2">
                        {result.plan.map((d) => (
                            <div key={d.day} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-800">Day {d.day} · {d.focus}</p>
                                    {d.hours && <span className="text-xs text-slate-400">{d.hours}h</span>}
                                </div>
                                <ul className="mt-2 space-y-1">
                                    {(d.tasks || []).map((t, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                                            <ChevronRight size={12} className="mt-0.5 shrink-0 text-indigo-400" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AiTools() {
    const [active, setActive] = useState("questions");
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        getAiStatus()
            .then((res) => setProvider(res.provider))
            .catch(() => setProvider(null));
    }, []);

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">AI Tools</h1>
                    <p className="text-sm text-slate-500">Generate questions, gauge difficulty, analyse performance, and plan your prep.</p>
                </div>
                {provider && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                            provider === "gemini" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}
                    >
                        <Sparkles size={13} />
                        {provider === "gemini" ? "Powered by Gemini" : "Sample mode · add GEMINI_API_KEY"}
                    </span>
                )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
                {TOOLS.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActive(t.key)}
                            className={cn(
                                "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
                                active === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Icon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {active === "questions" && <QuestionGen />}
            {active === "predictor" && <Predictor />}
            {active === "analyzer" && <Analyzer />}
            {active === "planner" && <Planner />}
        </div>
    );
}
