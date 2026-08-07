import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GraduationCap, Loader2, ChevronDown, ChevronUp, Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { adminListCourses, adminCreateCourse, adminUpdateCourse, adminDeleteCourse } from "@/Api/CoursesApi";
import { getExams } from "@/Api/ExamsApi";

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const inCls = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const taCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const Field = ({ label, children }) => (
    <label className="block">
        <span className="mb-0.5 block text-[11px] font-semibold text-slate-500">{label}</span>
        {children}
    </label>
);

// Edit/create form. Module-scoped so it isn't recreated each render.
function CourseForm({ initial, exams, onSave, onCancel, onDelete, saving }) {
    const [f, setF] = useState(() => ({
        name: initial.name || "",
        examCode: initial.examCode || "",
        kind: initial.kind || "exam",
        tagline: initial.tagline || "",
        description: initial.description || "",
        price: initial.price ?? 0,
        mrp: initial.mrp ?? 0,
        successPromise: initial.successPromise || "",
        validityDays: initial.validityDays ?? 365,
        order: initial.order ?? 0,
        published: initial.published ?? false,
    }));
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const off = f.mrp > f.price ? Math.round((1 - f.price / f.mrp) * 100) : 0;

    return (
        <div className="mt-2 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <Field label="Batch name"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={inCls} placeholder="e.g. IPU LEET 2027 Foundation Batch" /></Field>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Type">
                    <select value={f.kind} onChange={(e) => set("kind", e.target.value)} className={inCls}>
                        <option value="exam">Exam batch</option>
                        <option value="counselling">Counselling pack</option>
                    </select>
                </Field>
                {f.kind === "exam" && (
                    <Field label="Exam">
                        <select value={f.examCode} onChange={(e) => set("examCode", e.target.value)} className={inCls}>
                            <option value="">Select exam…</option>
                            {exams.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}
                        </select>
                    </Field>
                )}
            </div>
            <Field label="Tagline"><input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} className={inCls} /></Field>
            <Field label="Description"><textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} className={taCls} /></Field>
            <div className="grid grid-cols-3 gap-2">
                <Field label="Price ₹"><input type="number" value={f.price} onChange={(e) => set("price", e.target.value)} className={inCls} /></Field>
                <Field label={`Original ₹ ${off ? `(${off}% off)` : ""}`}><input type="number" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} className={inCls} /></Field>
                <Field label="Validity (days)"><input type="number" value={f.validityDays} onChange={(e) => set("validityDays", e.target.value)} className={inCls} /></Field>
            </div>
            <Field label="Success Promise (short summary shown on the card)"><textarea rows={2} value={f.successPromise} onChange={(e) => set("successPromise", e.target.value)} className={taCls} /></Field>
            <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" /> Published (live to students)
                </label>
                <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    Order <input type="number" value={f.order} onChange={(e) => set("order", e.target.value)} className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                </label>
            </div>
            <div className="flex items-center gap-2 pt-1">
                <button onClick={() => onSave(f)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
                <button onClick={onCancel} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                {onDelete && (
                    <button onClick={onDelete} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10">
                        <Trash2 size={14} /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default function CoursesAdmin() {
    const [open, setOpen] = useState(false);
    const [courses, setCourses] = useState(null);
    const [exams, setExams] = useState([]);
    const [editing, setEditing] = useState(null); // course _id | "__new__" | null
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => adminListCourses().then(setCourses).catch(() => setCourses([])), []);
    useEffect(() => {
        if (open) { load(); getExams().then(setExams).catch(() => {}); }
    }, [open, load]);

    const save = async (id, f) => {
        setSaving(true);
        try {
            const body = { ...f, price: Number(f.price) || 0, mrp: Number(f.mrp) || 0, validityDays: Number(f.validityDays) || 365, order: Number(f.order) || 0 };
            if (id === "__new__") { await adminCreateCourse(body); toast.success("Batch created"); }
            else { await adminUpdateCourse(id, body); toast.success("Saved"); }
            setEditing(null);
            load();
        } catch (e) { toast.error(e.message); } finally { setSaving(false); }
    };
    const remove = async (c) => {
        if (!window.confirm(`Delete "${c.name}"? This removes the batch and its enrollments — this can't be undone.`)) return;
        try { await adminDeleteCourse(c._id); toast.success("Deleted"); load(); } catch (e) { toast.error(e.message); }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <GraduationCap className="h-4 w-4 text-indigo-600" /> Batches — prices, discounts &amp; details
                <span className="font-normal text-slate-400">— edit any batch (price, discount, Success Promise…) or delete it</span>
                {open ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
            </button>

            {open && (
                <div className="mt-4 space-y-2">
                    {editing === "__new__" ? (
                        <CourseForm initial={{}} exams={exams} saving={saving} onSave={(f) => save("__new__", f)} onCancel={() => setEditing(null)} />
                    ) : (
                        <button onClick={() => setEditing("__new__")} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
                            <Plus size={15} /> New batch
                        </button>
                    )}

                    {courses === null ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
                    ) : courses.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-400">No batches yet.</p>
                    ) : (
                        courses.map((c) => (
                            <div key={c._id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            {c.name}
                                            {!c.published && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">Draft</span>}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {c.examName || (c.kind === "counselling" ? "Counselling" : "—")} · {rupee(c.price)}
                                            {c.mrp > c.price ? <span className="ml-1 line-through">{rupee(c.mrp)}</span> : null}
                                        </p>
                                    </div>
                                    <button onClick={() => setEditing(editing === c._id ? null : c._id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800" title={editing === c._id ? "Close" : "Edit"}>
                                        {editing === c._id ? <X size={16} /> : <Pencil size={15} />}
                                    </button>
                                </div>
                                {editing === c._id && (
                                    <CourseForm initial={c} exams={exams} saving={saving} onSave={(f) => save(c._id, f)} onCancel={() => setEditing(null)} onDelete={() => remove(c)} />
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
