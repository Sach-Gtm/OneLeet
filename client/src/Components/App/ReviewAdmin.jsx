import { useEffect, useRef, useState, useCallback } from "react";
import { Star, Loader2, Plus, Trash2, Quote, MonitorPlay, Image as ImageIcon, Upload, X, Pencil, Save, Eye, EyeOff, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getReviewsAdmin, createReview, updateReview, deleteReview } from "@/Api/ReviewsApi";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const taCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_IMAGE = 8 * 1024 * 1024;

const TYPES = [
    { key: "text", label: "Text", icon: Quote },
    { key: "image", label: "Image", icon: ImageIcon },
    { key: "video", label: "Video", icon: MonitorPlay },
];

const EMPTY = {
    type: "text", text: "", title: "", author: "",
    exam: "", rank: "", college: "", branch: "",
    isCase: false, caseTitle: "", caseStory: "",
    order: 0, published: true,
};

const toForm = (r) => ({
    type: r.type || "text", text: r.text || "", title: r.title || "", author: r.author || "",
    exam: r.exam || "", rank: r.rank || "", college: r.college || "", branch: r.branch || "",
    isCase: !!r.isCase, caseTitle: r.caseTitle || "", caseStory: r.caseStory || "",
    order: r.order || 0, published: r.published !== false,
});

// Admin-only: manage the Success Wall — text / image / video reviews with
// optional student details, and full "cases" (success stories) that get their
// own /success/:slug page. Add, edit every field, publish/unpublish, or remove.
export default function ReviewAdmin() {
    const [rows, setRows] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [editingId, setEditingId] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);
    const formRef = useRef(null);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const load = useCallback(() => {
        getReviewsAdmin().then(setRows).catch(() => setRows([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    const clearFile = () => {
        setFile(null);
        setPreview("");
        if (fileRef.current) fileRef.current.value = "";
    };
    const pickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const max = form.type === "video" ? MAX_VIDEO : MAX_IMAGE;
        if (f.size > max) return toast.error(form.type === "video" ? "Video must be 50 MB or smaller." : "Image must be 8 MB or smaller.");
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };
    const switchType = (t) => {
        setForm((f) => ({ ...f, type: t }));
        clearFile();
    };
    const resetForm = () => {
        setForm(EMPTY);
        setEditingId(null);
        clearFile();
    };
    const startEdit = (r) => {
        setForm(toForm(r));
        setEditingId(r._id);
        clearFile();
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (form.type === "text" && !form.text.trim()) return toast.error("Write the review message.");
        if (form.type === "image" && !editingId && !file) return toast.error("Choose an image to upload.");
        if (form.type === "video" && !editingId && !file) return toast.error("Choose a video clip to upload.");
        if (form.isCase && !form.caseStory.trim()) return toast.error("Write the story for the case (how you helped them).");
        setBusy(true);
        try {
            const payload = {
                type: form.type,
                text: form.text.trim(),
                title: form.title.trim(),
                author: form.author.trim(),
                exam: form.exam.trim(),
                rank: form.rank.trim(),
                college: form.college.trim(),
                branch: form.branch.trim(),
                isCase: form.isCase,
                caseTitle: form.caseTitle.trim(),
                caseStory: form.caseStory.trim(),
                order: Number(form.order) || 0,
                published: form.published,
                image: form.type === "image" ? file : undefined,
                video: form.type === "video" ? file : undefined,
            };
            if (editingId) {
                await updateReview(editingId, payload);
                toast.success("Saved — live on the Success Wall");
            } else {
                await createReview(payload);
                toast.success("Added — live on the Success Wall");
            }
            resetForm();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't save");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (r) => {
        if (!window.confirm("Remove this from the Success Wall?")) return;
        try {
            await deleteReview(r._id);
            toast.success("Removed");
            if (editingId === r._id) resetForm();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    const rowIcon = (t) => (t === "video" ? MonitorPlay : t === "image" ? ImageIcon : Quote);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Star className="h-4 w-4 text-amber-500" /> Success Wall
                <span className="font-normal text-slate-400">— reviews &amp; student success stories on the landing page</span>
            </div>

            <form ref={formRef} onSubmit={submit} className="mb-5 space-y-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{editingId ? "Editing" : "New"}</p>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">+ New instead</button>
                    )}
                </div>

                {/* Type */}
                <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                    {TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button key={t.key} type="button" onClick={() => switchType(t.key)}
                                className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition", form.type === t.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400")}>
                                <Icon size={14} /> {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Type-specific content */}
                {form.type === "text" && (
                    <textarea value={form.text} onChange={set("text")} rows={2} placeholder="What did the student say about OneLeet?" className={taCls} />
                )}
                {form.type !== "text" && (
                    <>
                        {preview ? (
                            <div className="relative overflow-hidden rounded-lg bg-slate-900">
                                {form.type === "video"
                                    ? <video src={preview} muted loop autoPlay playsInline className="mx-auto max-h-56" />
                                    : <img src={preview} alt="" className="mx-auto max-h-56 object-contain" />}
                                <button type="button" onClick={clearFile} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove file"><X size={12} /></button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600">
                                <Upload size={18} />
                                {form.type === "video" ? "Upload a video clip (MP4/WebM, ≤50 MB)" : "Upload an image — portrait works best (JPG/PNG, ≤8 MB)"}
                                {editingId && <span className="text-[11px] text-slate-400">Leave empty to keep the current file</span>}
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept={form.type === "video" ? "video/*" : "image/*"} onChange={pickFile} className="hidden" />
                        <input value={form.title} onChange={set("title")} placeholder="Caption / title (optional)" className={inCls} />
                    </>
                )}

                {/* Student details — all optional */}
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Student details (optional)</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <input value={form.author} onChange={set("author")} placeholder="Name" className={inCls} />
                        <input value={form.exam} onChange={set("exam")} placeholder="Exam (e.g. IPU LEET 2024)" className={inCls} />
                        <input value={form.rank} onChange={set("rank")} placeholder="Rank (e.g. AIR 54)" className={inCls} />
                        <input value={form.college} onChange={set("college")} placeholder="College (e.g. GGSIPU)" className={inCls} />
                        <input value={form.branch} onChange={set("branch")} placeholder="Branch (e.g. CSE)" className={inCls} />
                        <input type="number" value={form.order} onChange={set("order")} placeholder="Order" className={inCls} />
                    </div>
                </div>

                {/* Write case toggle → reveals the story fields */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 dark:border-amber-400/20 dark:bg-amber-400/5">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, isCase: !f.isCase }))}
                        className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition", form.isCase ? "bg-amber-500 text-white" : "bg-white text-amber-700 ring-1 ring-amber-300 dark:bg-slate-800 dark:text-amber-300")}>
                        <Sparkles size={13} /> {form.isCase ? "This is a success story" : "Write a case / success story"}
                    </button>
                    {form.isCase && (
                        <div className="mt-2.5 space-y-2">
                            <input value={form.caseTitle} onChange={set("caseTitle")} placeholder="Headline (e.g. How Aman went from diploma to GGSIPU)" className={inCls} />
                            <textarea value={form.caseStory} onChange={set("caseStory")} rows={5} placeholder={"The full story — how you helped them.\nSeparate paragraphs with a blank line. This becomes a public /success page (great for SEO)."} className={taCls} />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                        className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold", form.published ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                        {form.published ? <Eye size={13} /> : <EyeOff size={13} />} {form.published ? "Published" : "Hidden"}
                    </button>
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {busy ? "Saving…" : editingId ? "Save changes" : "Add"}
                    </button>
                </div>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Nothing yet — add your first above.</p>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r) => {
                        const Icon = rowIcon(r.type);
                        const meta = [r.rank, r.college, r.branch, r.exam].filter(Boolean).join(" · ");
                        return (
                            <li key={r._id} className={cn("flex items-center gap-3 py-2", editingId === r._id && "rounded-lg bg-indigo-50/60 dark:bg-indigo-500/5")}>
                                {r.image ? (
                                    <img src={r.image} alt="" className="h-11 w-9 shrink-0 rounded object-cover" />
                                ) : (
                                    <span className="grid h-11 w-9 shrink-0 place-items-center rounded bg-slate-100 text-slate-400 dark:bg-slate-800"><Icon size={15} /></span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {r.author || r.caseTitle || (r.type === "text" ? r.text : r.title) || `${r.type} review`}
                                        {r.isCase && <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Sparkles size={9} /> case</span>}
                                        {r.published === false && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800">hidden</span>}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">{[r.type, meta].filter(Boolean).join(" · ")}</p>
                                </div>
                                <button onClick={() => startEdit(r)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => remove(r)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
