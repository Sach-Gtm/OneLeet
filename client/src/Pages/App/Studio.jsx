import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    PencilRuler,
    Brain,
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
    Trophy,
    BookOpen,
    ListChecks,
    Lock,
    Repeat,
    Crown,
    ClipboardPaste,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isStaff } from "@/lib/roles";
import { TEST_FORMATS, TEST_FORMAT_KEYS } from "@/lib/testFormats";
import { parseQuestions } from "@/lib/parseQuestions";
import {
    aiDraft,
    listStudioTests,
    getStudioTest,
    createStudioTest,
    updateStudioTest,
    publishStudioTest,
    removeStudioTest,
} from "@/Api/StudioApi";
import { getSyllabi, deleteSyllabus, updateSyllabus } from "@/Api/SyllabusApi";
import NotesUploadModal from "@/Components/App/NotesUploadModal";
import SyllabusEditorModal from "@/Components/App/SyllabusEditorModal";
import ExamMultiSelect from "@/Components/App/ExamMultiSelect";

const blankQuestion = () => ({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    marks: 1,
    explanation: "",
});

const BULK_PLACEHOLDER = `Paste one question per block, e.g.

Bee : Hive :: Bird : ?
A) Sky
B) Nest
C) Tree
D) Egg
Answer: B
Explanation: A hive is a bee's home.

…or a JSON array:
[{"text":"…","options":["A","B","C","D"],"answer":"B","explanation":"…"}]`;

// Convert a stored Date/ISO into the value a <input type="datetime-local">
// expects (local "YYYY-MM-DDTHH:mm"), and back.
const toLocalInput = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
        dt.getHours()
    )}:${pad(dt.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const MODES = [
    { key: "test", label: "Test", icon: GraduationCap, hint: "Timed & graded — answers hidden until it closes, then ranking" },
    { key: "practice", label: "Practice", icon: Dumbbell, hint: "Answer is revealed the moment the student picks an option" },
];

export default function Studio() {
    const { user } = useAuth();

    const [mode, setMode] = useState("test");
    const [meta, setMeta] = useState({
        title: "",
        subject: "",
        description: "",
        durationMinutes: 30,
        openAt: "",
        closeAt: "",
    });
    const [questions, setQuestions] = useState([blankQuestion()]);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [targets, setTargets] = useState([]);
    const [editingId, setEditingId] = useState(null);
    // Locked size preset (null = custom, no lock). Picking one fixes the exact
    // question count the test must have to publish.
    const [format, setFormat] = useState(null);
    const needCount = format ? TEST_FORMATS[format].count : null;
    // Free by default; when on, only Premium students (and staff) can open it.
    const [premium, setPremium] = useState(false);

    // AI drafting inputs
    const [source, setSource] = useState("");
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState("moderate");
    const [drafting, setDrafting] = useState(false);

    const [saving, setSaving] = useState(false);
    const [list, setList] = useState([]);
    const [listFilter, setListFilter] = useState("all"); // all | test | practice
    const shownList =
        listFilter === "all"
            ? list
            : list.filter((t) => (listFilter === "practice" ? t.mode === "practice" : t.mode !== "practice"));

    // Notes & Syllabus authoring (both live here, staff-only).
    const [notesOpen, setNotesOpen] = useState(false);
    const [syllabusEditor, setSyllabusEditor] = useState({ open: false, editing: null });
    const [syllabi, setSyllabi] = useState([]);

    const staff = isStaff(user);

    const loadList = useCallback(async () => {
        try {
            setList(await listStudioTests());
        } catch {
            /* non-critical */
        }
    }, []);

    const loadSyllabi = useCallback(async () => {
        try {
            setSyllabi(await getSyllabi());
        } catch {
            /* non-critical */
        }
    }, []);

    useEffect(() => {
        if (staff) {
            loadList();
            loadSyllabi();
        }
    }, [staff, loadList, loadSyllabi]);

    // One-click free⇄premium for a global syllabus.
    const toggleSyllabusPremium = async (s) => {
        try {
            await updateSyllabus(s._id, { premium: !s.premium });
            toast.success(s.premium ? "Now Free" : "Now Premium");
            loadSyllabi();
        } catch (e) {
            toast.error(e?.response?.data?.message || "Couldn't update the syllabus.");
        }
    };

    const handleDeleteSyllabus = async (s) => {
        if (!window.confirm(`Delete "${s.title}"? This removes it and all student progress on it.`)) return;
        try {
            await deleteSyllabus(s._id);
            toast.success("Syllabus deleted");
            loadSyllabi();
        } catch (e) {
            toast.error(e?.response?.data?.message || "Couldn't delete the syllabus.");
        }
    };

    // Hooks first, then gate.
    if (user && !staff) return <Navigate to="/dashboard" replace />;

    const resetEditor = () => {
        setEditingId(null);
        setMeta({ title: "", subject: "", description: "", durationMinutes: 30, openAt: "", closeAt: "" });
        setQuestions([blankQuestion()]);
        setTargets([]);
        setSource("");
        setTopic("");
        setMode("test");
        setFormat(null);
        setPremium(false);
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
    const addQuestion = () =>
        setQuestions((qs) => (needCount && qs.length >= needCount ? qs : [...qs, blankQuestion()]));
    const removeQuestion = (i) => setQuestions((qs) => (qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs));

    // Bulk import: paste many questions (block format or JSON) straight into the
    // editor, then Save/Publish through the normal flow (format count still locks).
    const loadBulk = (mode) => {
        let parsed;
        try {
            parsed = parseQuestions(bulkText);
        } catch (e) {
            return toast.error(e.message || "Couldn't read those questions.");
        }
        setQuestions((qs) => {
            const kept = mode === "append" ? qs.filter((q) => q.text.trim() || q.options.some((o) => o.trim())) : [];
            return [...kept, ...parsed.map((p) => ({ ...blankQuestion(), ...p }))];
        });
        setBulkText("");
        setBulkOpen(false);
        toast.success(`Loaded ${parsed.length} question${parsed.length === 1 ? "" : "s"} — review & publish below`);
    };

    // Pick a locked format (or "custom"). Point the AI drafter at the same count
    // (capped at 20, its max) so a Quick Shot drafts 10 straight away.
    const pickFormat = (key) => {
        setFormat(key);
        if (key && TEST_FORMATS[key]) setCount(Math.min(TEST_FORMATS[key].count, 20));
    };

    const buildPayload = () => ({
        title: meta.title,
        subject: meta.subject,
        description: meta.description,
        mode,
        format,
        premium,
        durationMinutes: Number(meta.durationMinutes) || 30,
        // A close time makes it a competitive test (frozen leaderboard). Practice
        // sets never carry a window.
        openAt: mode === "test" ? fromLocalInput(meta.openAt) : null,
        closeAt: mode === "test" ? fromLocalInput(meta.closeAt) : null,
        targets,
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
        if (!targets.length) return "Choose at least one university (or select All universities).";
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
        // Locked format → must publish with EXACTLY its question count.
        if (publish && needCount && questions.length !== needCount) {
            return toast.error(
                `${TEST_FORMATS[format].label} must have exactly ${needCount} questions — you have ${questions.length}.`
            );
        }
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
            setFormat(t.format || null);
            setPremium(!!t.premium);
            setMeta({
                title: t.title || "",
                subject: t.subject || "",
                description: t.description || "",
                durationMinutes: t.durationMinutes || 30,
                openAt: toLocalInput(t.openAt),
                closeAt: toLocalInput(t.closeAt),
            });
            setTargets(t.targets || []);
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

    // Quick-flip a set between Test and Practice without opening the editor.
    const toggleTestMode = async (t) => {
        const next = t.mode === "practice" ? "test" : "practice";
        try {
            await updateStudioTest(t._id, { mode: next });
            toast.success(next === "practice" ? "Switched to Practice" : "Switched to Test");
            loadList();
        } catch (e) {
            toast.error(e.message || "Couldn't switch");
        }
    };

    // One-click free⇄premium for a set (only Premium students can open premium).
    const togglePremium = async (t) => {
        try {
            await updateStudioTest(t._id, { premium: !t.premium });
            toast.success(t.premium ? "Now Free" : "Now Premium");
            loadList();
        } catch (e) {
            toast.error(e.message || "Couldn't switch");
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
                    <PencilRuler className="h-6 w-6 text-indigo-600" /> AI Content Studio
                </h1>
                <p className="text-sm text-slate-500">
                    Paste material or name a topic, let AI draft it, then edit and publish.
                </p>
            </div>

            {/* Notes & Syllabus — both authored here (manual + AI), staff only */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-indigo-600" /> Notes &amp; Syllabus
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        onClick={() => setNotesOpen(true)}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <BookOpen size={18} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">Add a study note</p>
                            <p className="text-xs text-slate-400">Write, upload a PDF, or draft with AI</p>
                        </div>
                        <Plus className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                    <button
                        onClick={() => setSyllabusEditor({ open: true, editing: null })}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <ListChecks size={18} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">Add a syllabus</p>
                            <p className="text-xs text-slate-400">By hand, AI-refine, or scan a PDF</p>
                        </div>
                        <Plus className="ml-auto h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                </div>

                {syllabi.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Your syllabi</p>
                        <ul className="divide-y divide-slate-100">
                            {syllabi.map((s) => {
                                const topics = (s.chapters || []).reduce((n, c) => n + (c.topics?.length || 0), 0);
                                return (
                                    <li key={s._id} className="flex items-center gap-3 py-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-700">{s.title}</p>
                                            <p className="text-xs text-slate-400">
                                                {s.subject ? `${s.subject} · ` : ""}
                                                {topics} topic{topics === 1 ? "" : "s"}
                                                {!s.published ? " · draft" : ""}
                                                {s.premium ? " · premium" : ""}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleSyllabusPremium(s)}
                                            title={s.premium ? "Premium — click to make Free" : "Free — click to make Premium"}
                                            className={
                                                "grid h-8 w-8 place-items-center rounded-md border " +
                                                (s.premium
                                                    ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                    : "border-slate-200 text-slate-400 hover:bg-slate-50")
                                            }
                                        >
                                            <Crown className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setSyllabusEditor({ open: true, editing: s })}
                                            title="Edit"
                                            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSyllabus(s)}
                                            title="Delete"
                                            className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {/* Create with AI */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Brain className="h-4 w-4 text-indigo-600" /> Draft a test with AI
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
                        {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
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

                <div className="mt-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Target universities / LEET *
                    </label>
                    <ExamMultiSelect value={targets} onChange={setTargets} allowAll height="max-h-40" />
                </div>

                {/* Locked size format. Picking one fixes the exact question count. */}
                <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Format <span className="font-normal text-slate-400">— locks the question count</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => pickFormat(null)}
                            className={
                                "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
                                (!format
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")
                            }
                        >
                            Custom
                        </button>
                        {TEST_FORMAT_KEYS.map((k) => {
                            const f = TEST_FORMATS[k];
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => pickFormat(k)}
                                    className={
                                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
                                        (format === k
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")
                                    }
                                    title={`${f.label} — exactly ${f.count} questions`}
                                >
                                    <span>{f.emoji}</span> {f.label}
                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{f.count}</span>
                                </button>
                            );
                        })}
                    </div>
                    {needCount && (
                        <div
                            className={
                                "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold " +
                                (questions.length === needCount
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700")
                            }
                        >
                            <Lock className="h-3 w-3" />
                            {questions.length}/{needCount} questions
                            {questions.length !== needCount &&
                                ` — ${questions.length < needCount ? `add ${needCount - questions.length} more` : `remove ${questions.length - needCount}`} to publish`}
                        </div>
                    )}
                </div>

                {/* Premium gate — free unless staff turn this on */}
                <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3">
                    <input
                        type="checkbox"
                        checked={premium}
                        onChange={(e) => setPremium(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <Crown className={"h-4 w-4 " + (premium ? "text-amber-500" : "text-slate-400")} />
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Premium only</p>
                        <p className="text-xs text-slate-400">
                            Only Premium students can open this — free students see it locked.
                        </p>
                    </div>
                </label>

                {mode === "test" && (
                    <>
                        <div className="mt-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <input
                                type="number"
                                min={1}
                                value={meta.durationMinutes}
                                onChange={(e) => setMeta((m) => ({ ...m, durationMinutes: e.target.value }))}
                                className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none"
                            />
                            <span className="text-sm text-slate-500">minutes per attempt</span>
                        </div>

                        {/* Optional competitive window. A close time turns this into a
                            competitive test: the leaderboard freezes until 5 minutes
                            after it closes, then finalises with ranks + achievements. */}
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <Trophy className="h-3.5 w-3.5 text-amber-500" /> Competitive window
                                <span className="font-normal text-slate-400">(optional)</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <label className="text-xs text-slate-500">
                                    Opens
                                    <input
                                        type="datetime-local"
                                        value={meta.openAt}
                                        onChange={(e) => setMeta((m) => ({ ...m, openAt: e.target.value }))}
                                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none"
                                    />
                                </label>
                                <label className="text-xs text-slate-500">
                                    Closes
                                    <input
                                        type="datetime-local"
                                        value={meta.closeAt}
                                        onChange={(e) => setMeta((m) => ({ ...m, closeAt: e.target.value }))}
                                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none"
                                    />
                                </label>
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                                Set a <strong>close time</strong> to run this as a competition — the
                                leaderboard stays hidden until 5 minutes after it closes, then
                                publishes ranks and notifies everyone. Leave both blank for an
                                always-open test with an instant, ungated result.
                            </p>
                        </div>
                    </>
                )}

                {/* Questions */}
                <div className="mt-5 space-y-4">
                    {/* Bulk paste / import — add many questions at once */}
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30">
                        <button
                            type="button"
                            onClick={() => setBulkOpen((o) => !o)}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700"
                        >
                            <ClipboardPaste className="h-4 w-4" /> Bulk paste / import questions
                            <span className="ml-auto text-xs font-normal text-slate-400">
                                {bulkOpen ? "Hide" : "Add many at once"}
                            </span>
                        </button>
                        {bulkOpen && (
                            <div className="border-t border-indigo-100 p-4">
                                <textarea
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    rows={9}
                                    placeholder={BULK_PLACEHOLDER}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    One block per question — the stem, then options as <b>A) B) C)</b> (or 1) 2) 3)),
                                    then an <b>Answer:</b> line and an optional <b>Explanation:</b> — or paste a JSON array.
                                </p>
                                <div className="mt-2.5 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => loadBulk("replace")}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                    >
                                        <ClipboardPaste className="h-4 w-4" /> Load (replace all)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loadBulk("append")}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        <Plus className="h-4 w-4" /> Add to list
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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

            {/* Existing content — every test & practice set you've made */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-slate-800">Your tests &amp; practice</h2>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold">
                        {[
                            { k: "all", label: "All" },
                            { k: "test", label: "Tests" },
                            { k: "practice", label: "Practice" },
                        ].map((o) => (
                            <button
                                key={o.k}
                                onClick={() => setListFilter(o.k)}
                                className={
                                    "rounded-md px-2.5 py-1 transition " +
                                    (listFilter === o.k ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50")
                                }
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
                {list.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                        Nothing yet — draft your first set above.
                    </p>
                ) : shownList.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                        No {listFilter} sets yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {shownList.map((t) => (
                            <li key={t._id} className="flex flex-wrap items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-slate-800">{t.title}</span>
                                        <span
                                            className={
                                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
                                                (t.status === "published"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-amber-50 text-amber-700")
                                            }
                                        >
                                            {t.status === "published" ? "live" : t.status}
                                        </span>
                                        <span
                                            className={
                                                "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                                                (t.mode === "practice"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-indigo-50 text-indigo-700")
                                            }
                                        >
                                            {t.mode === "practice" ? "Practice" : "Test"}
                                        </span>
                                        {t.format && TEST_FORMATS[t.format] && (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                {TEST_FORMATS[t.format].emoji} {TEST_FORMATS[t.format].label}
                                            </span>
                                        )}
                                        {t.premium && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                                                <Crown className="h-2.5 w-2.5" /> Premium
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {t.subject || "—"} · {t.questionCount} Qs · {t.totalMarks} marks
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => togglePremium(t)}
                                        title={t.premium ? "Premium — click to make Free" : "Free — click to make Premium"}
                                        className={
                                            "inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold transition " +
                                            (t.premium
                                                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50")
                                        }
                                    >
                                        <Crown className="h-3.5 w-3.5" /> {t.premium ? "Premium" : "Free"}
                                    </button>
                                    <button
                                        onClick={() => toggleTestMode(t)}
                                        title={`Switch to ${t.mode === "practice" ? "Test" : "Practice"}`}
                                        className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
                                    >
                                        <Repeat className="h-3.5 w-3.5" /> {t.mode === "practice" ? "Test" : "Practice"}
                                    </button>
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

            {notesOpen && (
                <NotesUploadModal open onClose={() => setNotesOpen(false)} onUploaded={() => {}} />
            )}
            {syllabusEditor.open && (
                <SyllabusEditorModal
                    open
                    isStaff
                    editing={syllabusEditor.editing}
                    onClose={() => setSyllabusEditor({ open: false, editing: null })}
                    onSaved={loadSyllabi}
                />
            )}
        </div>
    );
}
