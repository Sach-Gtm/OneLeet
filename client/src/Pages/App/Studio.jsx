import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Sparkles,
    Wand2,
    Plus,
    Trash2,
    Loader2,
    Save,
    Send,
    Pencil,
    FileText,
    GraduationCap,
    Dumbbell,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isStaff } from "@/lib/roles";
import {
    aiDraft,
    listStudioTests,
    getStudioTest,
    createStudioTest,
    updateStudioTest,
    publishStudioTest,
    removeStudioTest,
} from "@/Api/StudioApi";

const blankQuestion = () => ({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    marks: 1,
    explanation: "",
});

const MODES = [
    { key: "test", label: "Test", icon: GraduationCap, hint: "Timed & graded — answers hidden until it closes, then ranking" },
    { key: "practice", label: "Practice", icon: Dumbbell, hint: "Answer is revealed the moment the student picks an option" },
];

export default function Studio() {
    const { user } = useAuth();

    const [mode, setMode] = useState("test");
    const [meta, setMeta] = useState({ title: "", subject: "", description: "", durationMinutes: 30 });
    const [questions, setQuestions] = useState([blankQuestion()]);
    const [editingId, setEditingId] = useState(null);

    // AI drafting inputs
    const [source, setSource] = useState("");
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState("moderate");
    const [drafting, setDrafting] = useState(false);

    const [saving, setSaving] = useState(false);
    const [list, setList] = useState([]);

    const staff = isStaff(user);

    const loadList = useCallback(async () => {
        try {
            setList(await listStudioTests());
        } catch {
            /* non-critical */
        }
    }, []);

    useEffect(() => {
        if (staff) loadList();
    }, [staff, loadList]);

    // Hooks first, then gate.
    if (user && !staff) return <Navigate to="/dashboard" replace />;

    const resetEditor = () => {
        setEditingId(null);
        setMeta({ title: "", subject: "", description: "", durationMinutes: 30 });
        setQuestions([blankQuestion()]);
        setSource("");
        setTopic("");
        setMode("test");
    };

    const handleDraft = async () => {
        if (!source.trim() && !topic.trim()) {
            toast.error("Paste some material or enter a topic first.");
            return;
        }
        setDrafting(true);
        try {
            const draft = await aiDraft({ text: source, topic, subject: meta.subject, mode, count, difficulty });
            setMeta((m) => ({
                ...m,
                title: m.title || draft.title || "",
                description: m.description || draft.description || "",
            }));
            const qs = (draft.questions || []).map((q) => ({
                text: q.text || q.question || "",
                options: Array.isArray(q.options) && q.options.length ? q.options : ["", "", "", ""],
                correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
                marks: q.marks || 1,
                explanation: q.explanation || "",
            }));
            setQuestions(qs.length ? qs : [blankQuestion()]);
            toast.success(`Drafted ${qs.length} question${qs.length === 1 ? "" : "s"} — review & edit below`);
        } catch (err) {
            toast.error(err.message || "Couldn't draft — try again");
        } finally {
            setDrafting(false);
        }
    };

    // Question editing helpers (immutable updates)
    const patchQ = (i, patch) =>
        setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
    const setOption = (i, j, val) =>
        setQuestions((qs) =>
            qs.map((q, idx) => (idx === i ? { ...q, options: q.options.map((o, k) => (k === j ? val : o)) } : q))
        );
    const addOption = (i) =>
        setQuestions((qs) => qs.map((q, idx) => (idx === i && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q)));
    const removeOption = (i, j) =>
        setQuestions((qs) =>
            qs.map((q, idx) => {
                if (idx !== i || q.options.length <= 2) return q;
                const options = q.options.filter((_, k) => k !== j);
                let correctIndex = q.correctIndex;
                if (j === correctIndex) correctIndex = 0;
                else if (j < correctIndex) correctIndex -= 1;
                return { ...q, options, correctIndex };
            })
        );
    const addQuestion = () => setQuestions((qs) => [...qs, blankQuestion()]);
    const removeQuestion = (i) => setQuestions((qs) => (qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs));

    const buildPayload = () => ({
        title: meta.title,
        subject: meta.subject,
        description: meta.description,
        mode,
        durationMinutes: Number(meta.durationMinutes) || 30,
        questions: questions.map((q) => ({
            text: q.text,
            options: q.options.map((o) => o.trim()).filter(Boolean),
            correctIndex: q.correctIndex,
            marks: Number(q.marks) || 1,
            explanation: q.explanation,
        })),
    });

    const validate = () => {
        if (!meta.title.trim()) return "Give it a title.";
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) return `Question ${i + 1} needs its text.`;
            if (q.options.map((o) => o.trim()).filter(Boolean).length < 2)
                return `Question ${i + 1} needs at least 2 options.`;
        }
        return null;
    };

    const handleSave = async (publish = false) => {
        const err = validate();
        if (err) return toast.error(err);
        setSaving(true);
        try {
            const payload = buildPayload();
            const saved = editingId
                ? await updateStudioTest(editingId, payload)
                : await createStudioTest(payload);
            if (publish) await publishStudioTest(saved._id);
            toast.success(publish ? "Published — live for students" : "Draft saved");
            resetEditor();
            loadList();
        } catch (e) {
            toast.error(e.message || "Couldn't save");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (id) => {
        try {
            const t = await getStudioTest(id);
            setEditingId(t._id);
            setMode(t.mode || "test");
            setMeta({
                title: t.title || "",
                subject: t.subject || "",
                description: t.description || "",
                durationMinutes: t.durationMinutes || 30,
            });
            setQuestions(
                (t.questions || []).map((q) => ({
                    text: q.text || "",
                    options: q.options?.length ? q.options : ["", "", "", ""],
                    correctIndex: q.correctIndex ?? 0,
                    marks: q.marks ?? 1,
                    explanation: q.explanation || "",
                }))
            );
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            toast.error(e.message || "Couldn't open");
        }
    };

    const handlePublish = async (id) => {
        try {
            await publishStudioTest(id);
            toast.success("Published");
            loadList();
        } catch (e) {
            toast.error(e.message || "Couldn't publish");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this content permanently?")) return;
        try {
            await removeStudioTest(id);
            toast.success("Deleted");
            if (editingId === id) resetEditor();
            loadList();
        } catch (e) {
            toast.error(e.message || "Couldn't delete");
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <Sparkles className="h-6 w-6 text-indigo-600" /> AI Content Studio
                </h1>
                <p className="text-sm text-slate-500">
                    Paste material or name a topic, let AI draft it, then edit and publish.
                </p>
            </div>

            {/* Create with AI */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Wand2 className="h-4 w-4 text-indigo-600" /> Draft with AI
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:max-w-md">
                    {MODES.map((m) => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => setMode(m.key)}
                                title={m.hint}
                                className={
                                    "flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold transition " +
                                    (mode === m.key
                                        ? "border-indigo-600 bg-white text-indigo-700 ring-1 ring-indigo-600"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")
                                }
                            >
                                <Icon className="h-4 w-4" /> {m.label}
                            </button>
                        );
                    })}
                </div>
                <textarea
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    rows={4}
                    placeholder="Paste your source material here (a chapter, notes, a solved paper)…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="…or just a topic (e.g. Thevenin's theorem)"
                        className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <select
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none"
                        title="How many questions"
                    >
                        {[3, 5, 10, 15, 20].map((n) => (
                            <option key={n} value={n}>{n} Qs</option>
                        ))}
                    </select>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none"
                    >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleDraft}
                        disabled={drafting}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Draft
                    </button>
                </div>
            </div>

            {/* Editable draft */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <FileText className="h-4 w-4 text-slate-500" />
                        {editingId ? "Editing content" : "New content"}
                    </div>
                    {editingId && (
                        <button onClick={resetEditor} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                            + Start fresh
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <input
                        value={meta.title}
                        onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                        placeholder="Title (e.g. Network Theorems — Set 1)"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        value={meta.subject}
                        onChange={(e) => setMeta((m) => ({ ...m, subject: e.target.value }))}
                        placeholder="Subject (e.g. Electrical)"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                {mode === "test" && (
                    <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <input
                            type="number"
                            min={1}
                            value={meta.durationMinutes}
                            onChange={(e) => setMeta((m) => ({ ...m, durationMinutes: e.target.value }))}
                            className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none"
                        />
                        <span className="text-sm text-slate-500">minutes</span>
                    </div>
                )}

                {/* Questions */}
                <div className="mt-5 space-y-4">
                    {questions.map((q, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-4">
                            <div className="mb-2 flex items-start gap-2">
                                <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                    {i + 1}
                                </span>
                                <textarea
                                    value={q.text}
                                    onChange={(e) => patchQ(i, { text: e.target.value })}
                                    rows={2}
                                    placeholder="Question text…"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button
                                    onClick={() => removeQuestion(i)}
                                    title="Remove question"
                                    className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="space-y-2 pl-8">
                                {q.options.map((opt, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${i}`}
                                            checked={q.correctIndex === j}
                                            onChange={() => patchQ(i, { correctIndex: j })}
                                            title="Mark correct"
                                            className="h-4 w-4 shrink-0 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <input
                                            value={opt}
                                            onChange={(e) => setOption(i, j, e.target.value)}
                                            placeholder={`Option ${j + 1}`}
                                            className={
                                                "h-9 flex-1 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 " +
                                                (q.correctIndex === j ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200")
                                            }
                                        />
                                        {q.options.length > 2 && (
                                            <button
                                                onClick={() => removeOption(i, j)}
                                                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                                                title="Remove option"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {q.options.length < 6 && (
                                    <button
                                        onClick={() => addOption(i)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                    >
                                        <Plus className="h-3 w-3" /> Add option
                                    </button>
                                )}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <label className="flex items-center gap-1 text-xs text-slate-500">
                                        Marks
                                        <input
                                            type="number"
                                            min={0}
                                            value={q.marks}
                                            onChange={(e) => patchQ(i, { marks: e.target.value })}
                                            className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none"
                                        />
                                    </label>
                                    <input
                                        value={q.explanation}
                                        onChange={(e) => patchQ(i, { explanation: e.target.value })}
                                        placeholder="Explanation (shown after answering)"
                                        className="h-8 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addQuestion}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                    >
                        <Plus className="h-4 w-4" /> Add question
                    </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        <Send className="h-4 w-4" /> Publish for students
                    </button>
                </div>
            </div>

            {/* Existing content */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-800">Your content</h2>
                {list.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                        Nothing yet — draft your first set above.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {list.map((t) => (
                            <li key={t._id} className="flex flex-wrap items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-slate-800">{t.title}</span>
                                        <span
                                            className={
                                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
                                                (t.status === "published"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-amber-50 text-amber-700")
                                            }
                                        >
                                            {t.status}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                            {t.mode}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {t.subject || "—"} · {t.questionCount} Qs · {t.totalMarks} marks
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleEdit(t._id)}
                                        title="Edit"
                                        className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {t.status !== "published" && (
                                        <button
                                            onClick={() => handlePublish(t._id)}
                                            title="Publish"
                                            className="grid h-8 w-8 place-items-center rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(t._id)}
                                        title="Delete"
                                        className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
