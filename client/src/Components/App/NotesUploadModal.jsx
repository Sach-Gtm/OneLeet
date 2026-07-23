import { useState } from "react";
import { X, Sparkles, Loader2, UploadCloud, PenLine, FileText, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { uploadNote, generateNoteDraft } from "@/Api/NotesApi";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "mb-1 block text-xs font-semibold text-slate-600";

const emptyForm = {
    title: "",
    subject: "",
    description: "",
    teacher: "",
    branch: "",
    level: "",
    difficulty: "intermediate",
    content: "",
};

// Staff-only modal to publish a study note two ways:
//   • Normal  — upload a PDF and/or type the note yourself.
//   • AI draft — generate the note body from a topic, review/edit, publish.
export default function NotesUploadModal({ open, onClose, onUploaded }) {
    const [tab, setTab] = useState("normal");
    const [form, setForm] = useState(emptyForm);
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);

    // AI-draft inputs
    const [aiTopic, setAiTopic] = useState("");
    const [aiPoints, setAiPoints] = useState("");
    const [drafted, setDrafted] = useState(false);

    if (!open) return null;

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const reset = () => {
        setForm(emptyForm);
        setFile(null);
        setAiTopic("");
        setAiPoints("");
        setDrafted(false);
        setTab("normal");
    };

    const close = () => {
        if (busy) return;
        reset();
        onClose();
    };

    const generate = async () => {
        if (!aiTopic.trim()) return toast.error("Enter a topic to draft from.");
        setBusy(true);
        try {
            const res = await generateNoteDraft({
                topic: aiTopic,
                subject: form.subject,
                level: form.level,
                difficulty: form.difficulty,
                points: aiPoints,
            });
            const d = res.draft || {};
            setForm((f) => ({
                ...f,
                title: d.title || aiTopic,
                description: d.description || "",
                content: d.content || "",
            }));
            setDrafted(true);
            if (d.provider === "stub") {
                toast("Sample draft shown — add a Gemini key for real AI notes.", { icon: "✨" });
            } else {
                toast.success("Draft ready — review and edit before publishing.");
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Couldn't generate a draft.");
        } finally {
            setBusy(false);
        }
    };

    const publish = async (source) => {
        if (!form.title.trim()) return toast.error("Give the note a title.");
        if (source === "manual" && !file && !form.content.trim()) {
            return toast.error("Attach a PDF or write the note content.");
        }
        if (source === "ai" && !form.content.trim()) {
            return toast.error("Generate or write some content first.");
        }
        setBusy(true);
        try {
            const fields = {
                title: form.title,
                subject: form.subject,
                description: form.description,
                teacher: form.teacher,
                branch: form.branch,
                level: form.level,
                difficulty: form.difficulty,
                content: form.content,
                source,
            };
            if (source === "ai") fields.format = "text";
            await uploadNote(fields, source === "ai" ? null : file);
            toast.success("Note published 🎉");
            reset();
            onUploaded?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || "Couldn't publish the note.");
        } finally {
            setBusy(false);
        }
    };

    const tabBtnCls = (id) =>
        cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition",
            tab === id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
        );

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={close} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <FileText size={16} />
                        </span>
                        <p className="text-sm font-bold text-slate-800">Add a study note</p>
                    </div>
                    <button
                        onClick={close}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mx-5 mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
                    <button type="button" onClick={() => setTab("normal")} className={tabBtnCls("normal")}>
                        <PenLine size={15} /> Write / Upload
                    </button>
                    <button type="button" onClick={() => setTab("ai")} className={tabBtnCls("ai")}>
                        <Sparkles size={15} /> AI draft
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {tab === "ai" && !drafted ? (
                        <>
                            <p className="text-xs text-slate-500">
                                Describe the topic and the AI will write structured LEET study notes you can edit
                                before publishing.
                            </p>
                            <div>
                                <label className={labelCls}>Topic *</label>
                                <input
                                    className={inputCls}
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    placeholder="e.g. First Law of Thermodynamics"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Subject</label>
                                    <input
                                        className={inputCls}
                                        value={form.subject}
                                        onChange={(e) => set("subject", e.target.value)}
                                        placeholder="Mechanical"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Difficulty</label>
                                    <select
                                        className={inputCls}
                                        value={form.difficulty}
                                        onChange={(e) => set("difficulty", e.target.value)}
                                    >
                                        {DIFFICULTIES.map((d) => (
                                            <option key={d} value={d} className="capitalize">
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Level</label>
                                <input
                                    className={inputCls}
                                    value={form.level}
                                    onChange={(e) => set("level", e.target.value)}
                                    placeholder="e.g. 2nd Year / Diploma"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Key points to cover (optional)</label>
                                <textarea
                                    rows={3}
                                    className={cn(inputCls, "h-auto py-2")}
                                    value={aiPoints}
                                    onChange={(e) => setAiPoints(e.target.value)}
                                    placeholder="e.g. definition, formula, sign convention, one solved example"
                                />
                            </div>
                            <button
                                onClick={generate}
                                disabled={busy}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles size={15} />}
                                {busy ? "Generating…" : "Generate draft"}
                            </button>
                        </>
                    ) : (
                        <>
                            {tab === "ai" && drafted && (
                                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles size={13} /> AI draft — review &amp; edit, then publish.
                                    </span>
                                    <button
                                        onClick={() => setDrafted(false)}
                                        className="inline-flex items-center gap-1 font-semibold hover:underline"
                                    >
                                        <RotateCw size={12} /> Redo
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className={labelCls}>Title *</label>
                                <input
                                    className={inputCls}
                                    value={form.title}
                                    onChange={(e) => set("title", e.target.value)}
                                    placeholder="Note title"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Subject</label>
                                    <input
                                        className={inputCls}
                                        value={form.subject}
                                        onChange={(e) => set("subject", e.target.value)}
                                        placeholder="e.g. Physics"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Teacher / Author</label>
                                    <input
                                        className={inputCls}
                                        value={form.teacher}
                                        onChange={(e) => set("teacher", e.target.value)}
                                        placeholder="e.g. Prof. R.K. Gupta"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls}>Branch</label>
                                    <input
                                        className={inputCls}
                                        value={form.branch}
                                        onChange={(e) => set("branch", e.target.value)}
                                        placeholder="CSE"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Level</label>
                                    <input
                                        className={inputCls}
                                        value={form.level}
                                        onChange={(e) => set("level", e.target.value)}
                                        placeholder="2nd Year"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Difficulty</label>
                                    <select
                                        className={inputCls}
                                        value={form.difficulty}
                                        onChange={(e) => set("difficulty", e.target.value)}
                                    >
                                        {DIFFICULTIES.map((d) => (
                                            <option key={d} value={d} className="capitalize">
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Short description</label>
                                <input
                                    className={inputCls}
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    placeholder="One line shown on the note card"
                                />
                            </div>

                            {/* Normal mode: PDF upload */}
                            {tab === "normal" && (
                                <div>
                                    <label className={labelCls}>PDF file (optional)</label>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-indigo-400">
                                        <UploadCloud size={18} className="text-slate-400" />
                                        <span className="truncate">
                                            {file ? file.name : "Choose a PDF (max 10 MB)"}
                                        </span>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className="hidden"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className={labelCls}>
                                    {tab === "ai" ? "Note content" : "Or write the note here (optional)"}
                                </label>
                                <textarea
                                    rows={tab === "ai" ? 10 : 5}
                                    className={cn(inputCls, "h-auto py-2 font-mono text-[13px] leading-relaxed")}
                                    value={form.content}
                                    onChange={(e) => set("content", e.target.value)}
                                    placeholder={"Markdown supported — use ## for headings and - for bullet points."}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!(tab === "ai" && !drafted) && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                        <button
                            onClick={close}
                            disabled={busy}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => publish(tab === "ai" ? "ai" : "manual")}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud size={15} />}
                            Publish note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
