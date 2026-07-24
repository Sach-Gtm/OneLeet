import { useState } from "react";
import { X, Brain, Loader2, UploadCloud, PenLine, ScanLine, Plus, Trash2, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { createSyllabus, updateSyllabus, aiDraftSyllabus, aiScanSyllabus } from "@/Api/SyllabusApi";
import ExamMultiSelect from "@/Components/App/ExamMultiSelect";

const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "mb-1 block text-xs font-semibold text-slate-600";

function toEditable(chapters) {
    return (chapters || []).map((ch) => ({
        _id: ch._id,
        title: ch.title || "",
        topics: (ch.topics || []).map((t) => ({
            _id: t._id,
            title: t.title || "",
            estimatedHours: t.estimatedHours ?? 0,
        })),
    }));
}

// Create or edit a syllabus. Chapters/topics can be filled by hand, AI-refined
// from pasted text, or scanned from an uploaded PDF — all land in the same
// editable structure the author reviews before saving.
export default function SyllabusEditorModal({ open, onClose, onSaved, editing, isStaff = false }) {
    const isEdit = Boolean(editing?._id);
    // Students build syllabi by hand only — AI refine/scan is staff-only, so they
    // always start (and stay) on the Manual tab.
    const [tab, setTab] = useState(isEdit || !isStaff ? "manual" : "ai");
    const [title, setTitle] = useState(editing?.title || "");
    const [subject, setSubject] = useState(editing?.subject || "");
    const [chapters, setChapters] = useState(toEditable(editing?.chapters));
    const [targets, setTargets] = useState(editing?.targets || []);
    const [aiText, setAiText] = useState("");
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);

    if (!open) return null;

    const addChapter = () => setChapters((cs) => [...cs, { title: "", topics: [{ title: "", estimatedHours: 1 }] }]);
    const removeChapter = (ci) => setChapters((cs) => cs.filter((_, i) => i !== ci));
    const setChapterTitle = (ci, v) =>
        setChapters((cs) => cs.map((c, i) => (i === ci ? { ...c, title: v } : c)));
    const addTopic = (ci) =>
        setChapters((cs) => cs.map((c, i) => (i === ci ? { ...c, topics: [...c.topics, { title: "", estimatedHours: 1 }] } : c)));
    const removeTopic = (ci, ti) =>
        setChapters((cs) => cs.map((c, i) => (i === ci ? { ...c, topics: c.topics.filter((_, j) => j !== ti) } : c)));
    const setTopic = (ci, ti, patch) =>
        setChapters((cs) =>
            cs.map((c, i) => (i === ci ? { ...c, topics: c.topics.map((t, j) => (j === ti ? { ...t, ...patch } : t)) } : c))
        );

    const applyDraft = (draft) => {
        if (!title && draft.title) setTitle(draft.title);
        if (!subject && draft.subject) setSubject(draft.subject);
        setChapters(toEditable(draft.chapters));
        setTab("manual");
        toast.success(
            draft.provider === "stub"
                ? "Sample draft shown — enable AI (Gemini) for real results. Review & save."
                : "Draft ready — review, tweak hours, then save."
        );
    };

    const generateFromText = async () => {
        if (!aiText.trim()) return toast.error("Paste the syllabus text first.");
        setBusy(true);
        try {
            applyDraft(await aiDraftSyllabus(aiText, subject));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Couldn't draft the syllabus.");
        } finally {
            setBusy(false);
        }
    };

    const generateFromFile = async () => {
        if (!file) return toast.error("Choose a PDF to scan.");
        setBusy(true);
        try {
            applyDraft(await aiScanSyllabus(file, subject));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Couldn't scan that PDF.");
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!title.trim()) return toast.error("Give the syllabus a title.");
        const cleaned = chapters
            .map((c) => ({
                _id: c._id,
                title: c.title.trim(),
                topics: c.topics
                    .filter((t) => t.title.trim())
                    .map((t) => ({ _id: t._id, title: t.title.trim(), estimatedHours: Number(t.estimatedHours) || 0 })),
            }))
            .filter((c) => c.title && c.topics.length);
        if (!cleaned.length) return toast.error("Add at least one chapter with a topic.");
        if (!targets.length) return toast.error("Choose at least one university (or 'All universities').");
        setBusy(true);
        try {
            const payload = { title: title.trim(), subject, chapters: cleaned, targets };
            if (isEdit) await updateSyllabus(editing._id, payload);
            else await createSyllabus(payload);
            toast.success(isEdit ? "Syllabus updated" : "Syllabus created");
            onSaved?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Couldn't save the syllabus.");
        } finally {
            setBusy(false);
        }
    };

    const tabCls = (id) =>
        cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition sm:text-sm",
            tab === id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
        );
    const totalTopics = chapters.reduce((s, c) => s + c.topics.length, 0);
    const totalHours = chapters.reduce((s, c) => s + c.topics.reduce((h, t) => h + (Number(t.estimatedHours) || 0), 0), 0);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => !busy && onClose()} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <p className="text-sm font-bold text-slate-800">{isEdit ? "Edit syllabus" : "Add a syllabus"}</p>
                    <button onClick={() => !busy && onClose()} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 px-5 pt-4">
                    <div>
                        <label className={labelCls}>Title *</label>
                        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics" />
                    </div>
                    <div>
                        <label className={labelCls}>Subject</label>
                        <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
                    </div>
                </div>

                <div className="px-5 pt-3">
                    <label className={labelCls}>Target universities / LEET *</label>
                    <ExamMultiSelect value={targets} onChange={setTargets} allowAll height="max-h-40" />
                </div>

                {isStaff && (
                    <div className="mx-5 mt-3 flex gap-1 rounded-xl bg-slate-100 p-1">
                        <button type="button" onClick={() => setTab("manual")} className={tabCls("manual")}>
                            <PenLine size={14} /> Manual
                        </button>
                        <button type="button" onClick={() => setTab("ai")} className={tabCls("ai")}>
                            <Brain size={14} /> AI refine
                        </button>
                        <button type="button" onClick={() => setTab("scan")} className={tabCls("scan")}>
                            <ScanLine size={14} /> Scan PDF
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-5">
                    {tab === "ai" && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                Paste your whole syllabus (any format) — the AI will organise it into chapters and topics with
                                suggested study hours. You can edit everything before saving.
                            </p>
                            <textarea
                                rows={9}
                                className={cn(inputCls, "h-auto py-2 font-mono text-[13px] leading-relaxed")}
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                                placeholder={"Paste syllabus text here…\ne.g. Unit 1: Matrices, Determinants, Eigenvalues\nUnit 2: Differential Calculus…"}
                            />
                            <button
                                onClick={generateFromText}
                                disabled={busy}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain size={15} />}
                                {busy ? "Refining…" : "Refine into chapters & topics"}
                            </button>
                        </div>
                    )}

                    {tab === "scan" && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                Upload a syllabus PDF (even a scanned or photographed one) and the AI will read it and draft the
                                chapters and topics for you to review.
                            </p>
                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:border-indigo-400">
                                <UploadCloud size={18} className="text-slate-400" />
                                <span className="truncate">{file ? file.name : "Choose a PDF (max 10 MB)"}</span>
                                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </label>
                            <button
                                onClick={generateFromFile}
                                disabled={busy}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine size={15} />}
                                {busy ? "Scanning…" : "Scan & draft syllabus"}
                            </button>
                        </div>
                    )}

                    {tab === "manual" && (
                        <div className="space-y-3">
                            {chapters.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                                    <p className="text-sm text-slate-500">No chapters yet.</p>
                                    <p className="mt-0.5 text-xs text-slate-400">Add one by hand, or use “AI refine” / “Scan PDF”.</p>
                                </div>
                            ) : (
                                chapters.map((ch, ci) => (
                                    <div key={ci} className="rounded-xl border border-slate-200 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <GripVertical size={15} className="shrink-0 text-slate-300" />
                                            <input
                                                className={cn(inputCls, "h-9 font-semibold")}
                                                value={ch.title}
                                                onChange={(e) => setChapterTitle(ci, e.target.value)}
                                                placeholder={`Chapter ${ci + 1} title`}
                                            />
                                            <button
                                                onClick={() => removeChapter(ci)}
                                                className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                                aria-label="Remove chapter"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div className="space-y-1.5 pl-6">
                                            {ch.topics.map((t, ti) => (
                                                <div key={ti} className="flex items-center gap-2">
                                                    <input
                                                        className={cn(inputCls, "h-9")}
                                                        value={t.title}
                                                        onChange={(e) => setTopic(ci, ti, { title: e.target.value })}
                                                        placeholder={`Topic ${ti + 1}`}
                                                    />
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                                                            value={t.estimatedHours}
                                                            onChange={(e) => setTopic(ci, ti, { estimatedHours: e.target.value })}
                                                            title="Estimated study hours"
                                                        />
                                                        <span className="text-xs text-slate-400">hrs</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeTopic(ci, ti)}
                                                        className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                                                        aria-label="Remove topic"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addTopic(ci)}
                                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                                            >
                                                <Plus size={13} /> Add topic
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={addChapter}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                            >
                                <Plus size={15} /> Add chapter
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                    <span className="text-xs text-slate-400">
                        {totalTopics} topic{totalTopics === 1 ? "" : "s"} · {totalHours} hrs
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => !busy && onClose()} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {isEdit ? "Save changes" : "Create syllabus"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
