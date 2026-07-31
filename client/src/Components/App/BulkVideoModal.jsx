import { useMemo, useState } from "react";
import { X, Loader2, Layers, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import ExamMultiSelect from "@/Components/App/ExamMultiSelect";
import { bulkCreateVideos } from "@/Api/VideosApi";
import { parseYouTubeId, youTubeThumb } from "@/lib/youtube";

const inputCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const emptyRow = () => ({ url: "", chapter: "", topic: "" });

// Staff-only: add many YouTube links in one go, each becoming its own card, all
// under a SINGLE subject. A link with no title falls back to its chapter/topic.
export default function BulkVideoModal({ subjects = [], onClose, onSaved }) {
    const [subject, setSubject] = useState("");
    const [targets, setTargets] = useState([]);
    const [published, setPublished] = useState(true);
    const [premium, setPremium] = useState(false);
    const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
    const [paste, setPaste] = useState("");
    const [busy, setBusy] = useState(false);

    const setRow = (i, patch) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
    const addRow = () => setRows((r) => [...r, emptyRow()]);
    const removeRow = (i) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : [emptyRow()]));

    // Turn a pasted block of links (one per line) into rows.
    const addPasted = () => {
        const urls = paste.split(/\s*\n\s*/).map((s) => s.trim()).filter(Boolean);
        if (!urls.length) return;
        setRows((r) => [...r.filter((row) => row.url.trim()), ...urls.map((u) => ({ url: u, chapter: "", topic: "" })), emptyRow()]);
        setPaste("");
    };

    const validCount = useMemo(() => rows.filter((r) => parseYouTubeId(r.url)).length, [rows]);

    const save = async () => {
        if (!subject.trim()) return toast.error("Give this batch a subject.");
        if (!targets.length) return toast.error("Choose at least one university (or “All universities”).");
        if (!validCount) return toast.error("Add at least one valid YouTube link.");
        setBusy(true);
        try {
            const res = await bulkCreateVideos({
                subject: subject.trim(),
                targets,
                published,
                premium,
                items: rows
                    .filter((r) => r.url.trim())
                    .map((r) => ({ url: r.url.trim(), chapter: r.chapter.trim(), topic: r.topic.trim() })),
            });
            toast.success(res.message || `${res.createdCount} added`);
            onSaved?.(res);
            onClose?.();
        } catch (e) {
            toast.error(e.message || "Couldn't add the videos.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Layers size={16} />
                        </span>
                        <p className="text-sm font-bold text-slate-800">Add multiple videos</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto p-5">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Every link below is saved as its own card under <b>one subject</b>. Adding a different subject? Save this
                        batch first, then start another.
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className={labelCls}>Subject (for the whole batch)</span>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Reasoning"
                                list="bulk-subjects"
                                className={inputCls}
                            />
                            <datalist id="bulk-subjects">
                                {subjects.map((s) => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </label>
                        <div className="flex items-end gap-4 pb-1 text-sm text-slate-600">
                            <label className="flex items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    checked={published}
                                    onChange={(e) => setPublished(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                Published
                            </label>
                            <label className="flex items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    checked={premium}
                                    onChange={(e) => setPremium(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                />
                                Premium
                            </label>
                        </div>
                    </div>

                    <div>
                        <span className={labelCls}>Target universities / LEET</span>
                        <ExamMultiSelect value={targets} onChange={setTargets} allowAll height="max-h-32" />
                    </div>

                    <div>
                        <span className={labelCls}>Paste links (one per line)</span>
                        <textarea
                            value={paste}
                            onChange={(e) => setPaste(e.target.value)}
                            rows={2}
                            placeholder={"https://youtu.be/…\nhttps://youtu.be/…"}
                            className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                            type="button"
                            onClick={addPasted}
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                            <Plus size={12} /> Add these as rows
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={labelCls}>Links &amp; chapters</span>
                            <span className="text-[11px] text-slate-400">{validCount} valid</span>
                        </div>
                        {rows.map((r, i) => {
                            const vid = parseYouTubeId(r.url);
                            return (
                                <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
                                    {vid ? (
                                        <img src={youTubeThumb(vid)} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
                                    ) : (
                                        <span className="h-10 w-16 shrink-0 rounded bg-slate-100" />
                                    )}
                                    <div className="grid flex-1 gap-1.5 sm:grid-cols-3">
                                        <input value={r.url} onChange={(e) => setRow(i, { url: e.target.value })} placeholder="YouTube link" className={inputCls} />
                                        <input value={r.chapter} onChange={(e) => setRow(i, { chapter: e.target.value })} placeholder="Chapter (optional)" className={inputCls} />
                                        <input value={r.topic} onChange={(e) => setRow(i, { topic: e.target.value })} placeholder="Topic (optional)" className={inputCls} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(i)}
                                        className="mt-1 shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                        aria-label="Remove row"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                        >
                            <Plus size={13} /> Add row
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
                    <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={busy || !validCount}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add {validCount || ""} video{validCount === 1 ? "" : "s"}
                    </button>
                </div>
            </div>
        </div>
    );
}
