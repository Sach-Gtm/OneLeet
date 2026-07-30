import { useEffect, useState, useCallback } from "react";
import { ScrollText, Loader2, Plus, Trash2, Pencil, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getExams } from "@/Api/ExamsApi";
import {
    getAllExamPatterns,
    createExamPattern,
    updateExamPattern,
    deleteExamPattern,
} from "@/Api/ExamPatternApi";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const areaCls = cn(inCls, "h-auto py-2");

const BLANK = {
    examCode: "",
    examName: "",
    conductingBody: "",
    place: "",
    eligibility: "",
    fees: "",
    examMode: "",
    duration: "",
    totalQuestions: "",
    totalMarks: "",
    markingCorrect: "",
    markingNegative: "",
    markingNote: "",
    avgPlacement: "",
    importantDates: "",
    officialWebsite: "",
    notes: "",
    published: true,
    sections: [],
    topColleges: [],
};

function Field({ label, children, hint }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            {children}
            {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
        </label>
    );
}

// Admin-only: create / edit / delete the exam paper patterns students see on
// their dashboard (matched to them by the exam they picked in profile).
export default function ExamPatternAdmin() {
    const [rows, setRows] = useState(null);
    const [exams, setExams] = useState([]);
    const [form, setForm] = useState(BLANK);
    const [editingId, setEditingId] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        getAllExamPatterns()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
        getExams()
            .then(setExams)
            .catch(() => setExams([]));
    }, [load]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    // --- dynamic section rows ---
    const addSection = () =>
        setForm((f) => ({ ...f, sections: [...f.sections, { name: "", subjects: "", questions: "", marks: "", difficulty: "" }] }));
    const setSection = (i, k, v) =>
        setForm((f) => ({ ...f, sections: f.sections.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }));
    const removeSection = (i) => setForm((f) => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));

    // --- dynamic college rows ---
    const addCollege = () =>
        setForm((f) => ({ ...f, topColleges: [...f.topColleges, { name: "", location: "", avgPackage: "" }] }));
    const setCollege = (i, k, v) =>
        setForm((f) => ({ ...f, topColleges: f.topColleges.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)) }));
    const removeCollege = (i) => setForm((f) => ({ ...f, topColleges: f.topColleges.filter((_, idx) => idx !== i) }));

    const pickExam = (code) => {
        const name = exams.find((e) => e.code === code)?.name || "";
        // Fill the display name from the catalog on pick, unless the admin has
        // already typed a custom one.
        setForm((f) => ({ ...f, examCode: code, examName: f.examName?.trim() ? f.examName : name }));
    };

    const reset = () => {
        setForm(BLANK);
        setEditingId(null);
    };

    const startEdit = (p) => {
        setEditingId(p._id);
        setForm({
            ...BLANK,
            ...p,
            totalQuestions: p.totalQuestions ?? "",
            totalMarks: p.totalMarks ?? "",
            sections: (p.sections || []).map((s) => ({
                name: s.name || "",
                subjects: s.subjects || "",
                questions: s.questions ?? "",
                marks: s.marks ?? "",
                difficulty: s.difficulty || "",
            })),
            topColleges: (p.topColleges || []).map((c) => ({
                name: c.name || "",
                location: c.location || "",
                avgPackage: c.avgPackage || "",
            })),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const save = async (e) => {
        e.preventDefault();
        if (!form.examCode) return toast.error("Pick which exam this pattern is for.");
        if (!form.examName.trim()) return toast.error("Give the exam a name.");
        setBusy(true);
        try {
            if (editingId) {
                await updateExamPattern(editingId, form);
                toast.success("Pattern updated — live on the dashboard");
            } else {
                await createExamPattern(form);
                toast.success("Pattern added — live for students preparing for it");
            }
            reset();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't save");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (p) => {
        if (!window.confirm(`Remove the paper pattern for "${p.examName}"?`)) return;
        try {
            await deleteExamPattern(p._id);
            toast.success("Removed");
            if (editingId === p._id) reset();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <ScrollText className="h-4 w-4 text-indigo-500" /> Exam paper patterns
                <span className="font-normal text-slate-400">— shown on the dashboard to students preparing for that exam</span>
            </div>

            <form onSubmit={save} className="mb-5 space-y-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {editingId ? "Edit pattern" : "New pattern"}
                    </p>
                    {editingId && (
                        <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
                            <X size={12} /> Cancel edit
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Exam *" hint="Matches students who picked this in profile">
                        <select value={form.examCode} onChange={(e) => pickExam(e.target.value)} className={inCls}>
                            <option value="">Select exam…</option>
                            {exams.map((e) => (
                                <option key={e.code} value={e.code}>
                                    {e.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Display name *">
                        <input value={form.examName} onChange={(e) => set("examName", e.target.value)} placeholder="IPU LEET (GGSIPU)" className={inCls} />
                    </Field>
                    <Field label="Conducting body">
                        <input value={form.conductingBody} onChange={(e) => set("conductingBody", e.target.value)} placeholder="GGSIPU" className={inCls} />
                    </Field>
                    <Field label="Place / State">
                        <input value={form.place} onChange={(e) => set("place", e.target.value)} placeholder="Delhi NCR" className={inCls} />
                    </Field>
                    <Field label="Exam mode">
                        <input value={form.examMode} onChange={(e) => set("examMode", e.target.value)} placeholder="Online (CBT)" className={inCls} />
                    </Field>
                    <Field label="Duration">
                        <input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="2 hours 30 min" className={inCls} />
                    </Field>
                </div>

                <Field label="Eligibility">
                    <textarea value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} rows={2} placeholder="e.g. 3-year engineering diploma with min. 45% marks" className={areaCls} />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Application fees">
                        <input value={form.fees} onChange={(e) => set("fees", e.target.value)} placeholder="₹1,500 (Gen), ₹1,000 (SC/ST)" className={inCls} />
                    </Field>
                    <Field label="Avg. placement">
                        <input value={form.avgPlacement} onChange={(e) => set("avgPlacement", e.target.value)} placeholder="₹6–8 LPA" className={inCls} />
                    </Field>
                    <Field label="Total questions">
                        <input type="number" min="0" value={form.totalQuestions} onChange={(e) => set("totalQuestions", e.target.value)} placeholder="150" className={inCls} />
                    </Field>
                    <Field label="Total marks">
                        <input type="number" min="0" value={form.totalMarks} onChange={(e) => set("totalMarks", e.target.value)} placeholder="600" className={inCls} />
                    </Field>
                    <Field label="Marks per correct">
                        <input value={form.markingCorrect} onChange={(e) => set("markingCorrect", e.target.value)} placeholder="+4" className={inCls} />
                    </Field>
                    <Field label="Negative marking">
                        <input value={form.markingNegative} onChange={(e) => set("markingNegative", e.target.value)} placeholder="-1" className={inCls} />
                    </Field>
                </div>
                <Field label="Marking note (optional)">
                    <input value={form.markingNote} onChange={(e) => set("markingNote", e.target.value)} placeholder="No negative marking for numerical questions" className={inCls} />
                </Field>

                {/* Section-wise pattern */}
                <div className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Section-wise pattern</p>
                        <button type="button" onClick={addSection} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                            <Plus size={13} /> Add section
                        </button>
                    </div>
                    {form.sections.length === 0 ? (
                        <p className="py-2 text-center text-xs text-slate-400">No sections yet — add one.</p>
                    ) : (
                        <div className="space-y-2">
                            {form.sections.map((s, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                                    <input value={s.name} onChange={(e) => setSection(i, "name", e.target.value)} placeholder="Section" className={cn(inCls, "sm:w-32")} />
                                    <input value={s.subjects} onChange={(e) => setSection(i, "subjects", e.target.value)} placeholder="Subjects / topics" className={cn(inCls, "min-w-0 flex-1")} />
                                    <input type="number" min="0" value={s.questions} onChange={(e) => setSection(i, "questions", e.target.value)} placeholder="Qs" className={cn(inCls, "w-16")} />
                                    <input type="number" min="0" value={s.marks} onChange={(e) => setSection(i, "marks", e.target.value)} placeholder="Marks" className={cn(inCls, "w-20")} />
                                    <select value={s.difficulty} onChange={(e) => setSection(i, "difficulty", e.target.value)} className={cn(inCls, "w-28")}>
                                        <option value="">Difficulty</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                    <button type="button" onClick={() => removeSection(i)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove section">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top colleges */}
                <div className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Top colleges</p>
                        <button type="button" onClick={addCollege} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                            <Plus size={13} /> Add college
                        </button>
                    </div>
                    {form.topColleges.length === 0 ? (
                        <p className="py-2 text-center text-xs text-slate-400">No colleges yet — add one.</p>
                    ) : (
                        <div className="space-y-2">
                            {form.topColleges.map((c, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                                    <input value={c.name} onChange={(e) => setCollege(i, "name", e.target.value)} placeholder="College name" className={cn(inCls, "min-w-0 flex-1")} />
                                    <input value={c.location} onChange={(e) => setCollege(i, "location", e.target.value)} placeholder="Location" className={cn(inCls, "sm:w-36")} />
                                    <input value={c.avgPackage} onChange={(e) => setCollege(i, "avgPackage", e.target.value)} placeholder="Avg pkg" className={cn(inCls, "w-24")} />
                                    <button type="button" onClick={() => removeCollege(i)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove college">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Important dates">
                        <textarea value={form.importantDates} onChange={(e) => set("importantDates", e.target.value)} rows={2} placeholder="Applications: Mar–Apr · Exam: May · Result: Jun" className={areaCls} />
                    </Field>
                    <Field label="Official website">
                        <input value={form.officialWebsite} onChange={(e) => set("officialWebsite", e.target.value)} placeholder="ipu.ac.in" className={inCls} />
                    </Field>
                </div>
                <Field label="Other info / notes">
                    <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Anything else students should know" className={areaCls} />
                </Field>

                <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                        Published (visible to students)
                    </label>
                    <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingId ? "Save changes" : "Add pattern"}
                    </button>
                </div>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                    No exam patterns yet — add your first above.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((p) => (
                        <li key={p._id} className="flex items-center gap-3 py-2">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-slate-800">
                                <ScrollText size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{p.examName}</p>
                                <p className="truncate text-xs text-slate-400">
                                    {[p.place, `${(p.sections || []).length} sections`, p.published ? null : "Draft"].filter(Boolean).join(" · ")}
                                </p>
                            </div>
                            {!p.published && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                    Draft
                                </span>
                            )}
                            <button onClick={() => startEdit(p)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10" aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => remove(p)} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" aria-label="Remove">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
