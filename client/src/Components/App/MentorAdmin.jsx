import { useEffect, useRef, useState, useCallback } from "react";
import { Users, Loader2, Plus, Trash2, ImagePlus, X, Pencil, Save, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getMentorsAdmin, createMentor, updateMentor, deleteMentor } from "@/Api/MentorsApi";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const taCls = cn(inCls, "h-auto py-2 leading-relaxed");
const MAX_BYTES = 3 * 1024 * 1024;

const EMPTY = {
    name: "", slug: "", role: "", exam: "", handle: "", tagline: "",
    description: "", story: "", highlightsText: "", statsText: "", linksText: "",
    order: 0, published: true,
};

// Turn a saved mentor into editable form state (arrays → one-per-line text).
const toForm = (m) => ({
    name: m.name || "", slug: m.slug || "", role: m.role || "", exam: m.exam || "",
    handle: m.handle || "", tagline: m.tagline || "", description: m.description || "",
    story: m.story || "",
    highlightsText: (m.highlights || []).join("\n"),
    statsText: (m.stats || []).map((s) => `${s.value} | ${s.label}`).join("\n"),
    linksText: (m.links || []).map((l) => `${l.label} | ${l.url}`).join("\n"),
    order: m.order || 0, published: m.published !== false,
});

// Parse "a | b" lines into objects; keeps only rows with content.
const parseLines = (text, keys) =>
    text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [first, ...rest] = line.split("|");
        return { [keys[0]]: (first || "").trim(), [keys[1]]: rest.join("|").trim() };
    });

// Admin-only: manage the public Mentors page + each mentor's journey — add, edit
// every field, publish/unpublish, or remove.
export default function MentorAdmin() {
    const [rows, setRows] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [editingId, setEditingId] = useState(null); // null = creating
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);
    const formRef = useRef(null);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const load = useCallback(() => {
        getMentorsAdmin().then(setRows).catch(() => setRows([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    const pickPhoto = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_BYTES) return toast.error("Photo must be 3 MB or smaller.");
        setPhoto(f);
        setPreview(URL.createObjectURL(f));
    };
    const clearPhoto = () => {
        setPhoto(null);
        setPreview("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const resetForm = () => {
        setForm(EMPTY);
        setEditingId(null);
        clearPhoto();
    };

    const startEdit = (m) => {
        setForm(toForm(m));
        setEditingId(m._id);
        clearPhoto();
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Give the mentor a name.");
        setBusy(true);
        try {
            const payload = {
                name: form.name.trim(),
                slug: form.slug.trim(),
                role: form.role.trim(),
                exam: form.exam.trim(),
                handle: form.handle.trim(),
                tagline: form.tagline.trim(),
                description: form.description.trim(),
                story: form.story.trim(),
                highlights: form.highlightsText.split("\n").map((s) => s.trim()).filter(Boolean),
                stats: parseLines(form.statsText, ["value", "label"]).filter((s) => s.value || s.label),
                links: parseLines(form.linksText, ["label", "url"]).filter((l) => l.url),
                order: Number(form.order) || 0,
                published: form.published,
                photo,
            };
            if (editingId) {
                await updateMentor(editingId, payload);
                toast.success("Mentor updated — live on the Mentors page");
            } else {
                await createMentor(payload);
                toast.success("Mentor added — live on the Mentors page");
            }
            resetForm();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't save");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (m) => {
        if (!window.confirm(`Remove "${m.name}" from the Mentors page?`)) return;
        try {
            await deleteMentor(m._id);
            toast.success("Removed");
            if (editingId === m._id) resetForm();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Users className="h-4 w-4 text-indigo-500" /> Mentors &amp; journeys
                <span className="font-normal text-slate-400">— shown on the public Mentors page</span>
            </div>

            <form ref={formRef} onSubmit={submit} className="mb-5 space-y-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {editingId ? "Editing mentor" : "New mentor"}
                    </p>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            + New instead
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    {/* Photo picker */}
                    <div className="shrink-0">
                        {preview ? (
                            <div className="relative">
                                <img src={preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
                                <button type="button" onClick={clearPhoto} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-white" aria-label="Remove photo">
                                    <X size={11} />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-600" aria-label="Add photo">
                                <ImagePlus size={18} />
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <input value={form.name} onChange={set("name")} placeholder="Full name" className={inCls} />
                        <div className="flex gap-2">
                            <input value={form.role} onChange={set("role")} placeholder="Role (e.g. Founder & Head Mentor)" className={inCls} />
                            <input value={form.exam} onChange={set("exam")} placeholder="Cleared (e.g. IPU LEET — AIR 54)" className={inCls} />
                        </div>
                        <div className="flex gap-2">
                            <input value={form.handle} onChange={set("handle")} placeholder="@handle (optional)" className={inCls} />
                            <input value={form.slug} onChange={set("slug")} placeholder="url-slug (auto from name)" className={inCls} />
                            <input type="number" value={form.order} onChange={set("order")} placeholder="Order" className={cn(inCls, "w-20")} />
                        </div>
                    </div>
                </div>

                <input value={form.tagline} onChange={set("tagline")} placeholder="Tagline — one punchy line (card + hero)" className={inCls} />
                <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Short card blurb (optional)" className={taCls} />
                <textarea value={form.story} onChange={set("story")} rows={6} placeholder={"The journey — the full story.\nSeparate paragraphs with a blank line."} className={taCls} />

                <div className="grid gap-2 sm:grid-cols-3">
                    <textarea value={form.highlightsText} onChange={set("highlightsText")} rows={4} placeholder={"Highlights — one per line:\nAIR 54, no coaching\nGuided 100+ students"} className={taCls} />
                    <textarea value={form.statsText} onChange={set("statsText")} rows={4} placeholder={"Stats — value | label:\n54 | IPU LEET Rank\n100+ | Students guided"} className={taCls} />
                    <textarea value={form.linksText} onChange={set("linksText")} rows={4} placeholder={"Links — label | url:\noneleet.in | https://oneleet.in"} className={taCls} />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                            form.published
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        )}
                    >
                        {form.published ? <Eye size={13} /> : <EyeOff size={13} />}
                        {form.published ? "Published" : "Hidden"}
                    </button>
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingId ? "Save changes" : "Add mentor"}
                    </button>
                </div>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                    No mentors yet — add your first above.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((m) => (
                        <li key={m._id} className={cn("flex items-center gap-3 py-2", editingId === m._id && "rounded-lg bg-indigo-50/60 dark:bg-indigo-500/5")}>
                            {m.photo ? (
                                <img src={m.photo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                            ) : (
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-slate-800">
                                    {(m.name || "?").slice(0, 2).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {m.name}
                                    {m.published === false && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800">hidden</span>}
                                </p>
                                <p className="truncate text-xs text-slate-400">{[m.role, m.exam].filter(Boolean).join(" · ") || "—"}</p>
                            </div>
                            <button onClick={() => startEdit(m)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10" aria-label="Edit mentor">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(m)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove mentor">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
