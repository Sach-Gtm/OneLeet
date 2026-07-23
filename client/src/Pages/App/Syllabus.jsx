import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    ChevronDown,
    Clock,
    CheckCircle2,
    Circle,
    BookOpen,
    Loader2,
    Pencil,
    Trash2,
    GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { isStaff as isStaffUser } from "@/lib/roles";
import { getSyllabi, toggleTopic, deleteSyllabus } from "@/Api/SyllabusApi";
import SyllabusEditorModal from "@/Components/App/SyllabusEditorModal";

function computeProgress(chapters, completedSet) {
    let total = 0, done = 0, totalH = 0, doneH = 0;
    for (const ch of chapters || []) {
        for (const t of ch.topics || []) {
            total += 1;
            totalH += t.estimatedHours || 0;
            if (completedSet.has(String(t._id))) {
                done += 1;
                doneH += t.estimatedHours || 0;
            }
        }
    }
    return { total, done, totalH, doneH, percent: total ? Math.round((done / total) * 100) : 0 };
}

function ProgressRing({ value = 0, size = 120, stroke = 10, sublabel }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-100" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="url(#sylRing)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1)" }}
                />
                <defs>
                    <linearGradient id="sylRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4338ca" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{value}%</span>
                {sublabel && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{sublabel}</span>}
            </div>
        </div>
    );
}

function SyllabusCard({ syllabus, canManage, onToggle, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const completedSet = useMemo(
        () => new Set((syllabus.completedTopics || []).map(String)),
        [syllabus.completedTopics]
    );
    const prog = computeProgress(syllabus.chapters, completedSet);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 p-5">
                <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-900">{syllabus.title}</h3>
                            {syllabus.scope === "personal" ? (
                                <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                    Personal
                                </span>
                            ) : (
                                !syllabus.published && (
                                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                        Draft
                                    </span>
                                )
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {syllabus.subject ? `${syllabus.subject} · ` : ""}
                            {prog.total} topic{prog.total === 1 ? "" : "s"} · {prog.totalH} hrs
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                                    style={{ width: `${prog.percent}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-indigo-600">{prog.percent}%</span>
                        </div>
                    </div>
                    <ChevronDown className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} size={18} />
                </button>
                {canManage && (
                    <div className="flex shrink-0 gap-1">
                        <button onClick={() => onEdit(syllabus)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" aria-label="Edit syllabus">
                            <Pencil size={15} />
                        </button>
                        <button onClick={() => onDelete(syllabus)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500" aria-label="Delete syllabus">
                            <Trash2 size={15} />
                        </button>
                    </div>
                )}
            </div>

            {open && (
                <div className="space-y-4 border-t border-slate-100 p-5 pt-4">
                    {(syllabus.chapters || []).length === 0 ? (
                        <p className="text-sm text-slate-400">No chapters in this syllabus yet.</p>
                    ) : (
                        (syllabus.chapters || []).map((ch, ci) => {
                            const chDone = (ch.topics || []).filter((t) => completedSet.has(String(t._id))).length;
                            return (
                                <div key={ch._id || ci}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-700">{ch.title}</h4>
                                        <span className="text-xs font-medium text-slate-400">
                                            {chDone}/{(ch.topics || []).length}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {(ch.topics || []).map((t) => {
                                            const done = completedSet.has(String(t._id));
                                            return (
                                                <button
                                                    key={t._id}
                                                    onClick={() => onToggle(syllabus._id, t._id, !done)}
                                                    className={cn(
                                                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
                                                        done
                                                            ? "border-emerald-200 bg-emerald-50"
                                                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {done ? (
                                                        <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                                                    ) : (
                                                        <Circle size={18} className="shrink-0 text-slate-300" />
                                                    )}
                                                    <span className={cn("flex-1 text-sm", done ? "text-slate-400 line-through" : "text-slate-700")}>
                                                        {t.title}
                                                    </span>
                                                    {t.estimatedHours > 0 && (
                                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                                            <Clock size={11} /> {t.estimatedHours}h
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default function Syllabus() {
    const { user } = useAuth();
    const isStaff = isStaffUser(user);
    const meId = user?._id;
    // Who can edit/delete a given card: the owner of a personal syllabus, or any
    // staff member for a global (published) one.
    const canManage = (s) => (s.scope === "personal" ? String(s.createdBy) === String(meId) : isStaff);
    const [syllabi, setSyllabi] = useState(null);
    const [editor, setEditor] = useState({ open: false, editing: null });

    const load = () => getSyllabi().then(setSyllabi).catch(() => setSyllabi([]));
    useEffect(() => {
        load();
    }, []);

    const handleToggle = async (syllabusId, topicId, done) => {
        // Optimistic — flip the mark immediately, reconcile with the server after.
        setSyllabi((prev) =>
            (prev || []).map((s) => {
                if (String(s._id) !== String(syllabusId)) return s;
                const set = new Set((s.completedTopics || []).map(String));
                if (done) set.add(String(topicId));
                else set.delete(String(topicId));
                return { ...s, completedTopics: [...set] };
            })
        );
        try {
            const res = await toggleTopic(syllabusId, topicId, done);
            setSyllabi((prev) =>
                (prev || []).map((s) => (String(s._id) === String(syllabusId) ? { ...s, completedTopics: res.completedTopics } : s))
            );
        } catch {
            toast.error("Couldn't save that — please try again.");
            load();
        }
    };

    const handleDelete = async (s) => {
        if (!window.confirm(`Delete "${s.title}"? This removes it and everyone's progress on it.`)) return;
        try {
            await deleteSyllabus(s._id);
            toast.success("Syllabus deleted");
            load();
        } catch {
            toast.error("Couldn't delete the syllabus.");
        }
    };

    const overall = useMemo(() => {
        let total = 0, done = 0, totalH = 0, doneH = 0;
        for (const s of syllabi || []) {
            const set = new Set((s.completedTopics || []).map(String));
            const p = computeProgress(s.chapters, set);
            total += p.total;
            done += p.done;
            totalH += p.totalH;
            doneH += p.doneH;
        }
        return { total, done, totalH, doneH, percent: total ? Math.round((done / total) * 100) : 0 };
    }, [syllabi]);

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Syllabus Tracker</h1>
                    <p className="text-sm text-slate-500">Tick off topics as you finish them and watch your coverage grow.</p>
                </div>
                <button
                    onClick={() => setEditor({ open: true, editing: null })}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <Plus size={16} /> Add syllabus
                </button>
            </div>

            {syllabi === null ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            ) : syllabi.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <BookOpen className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No syllabus yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {isStaff
                            ? "Add one — paste it, scan a PDF, or build it by hand."
                            : "Add your own to start tracking — your mentors will also publish subject syllabi."}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Overall coverage */}
                    <div className="flex items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6">
                        <ProgressRing value={overall.percent} sublabel="covered" />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <GraduationCap size={16} className="text-indigo-600" /> Overall syllabus coverage
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                <span className="font-semibold text-slate-700">{overall.done}</span> of {overall.total} topics done
                                {overall.totalH > 0 && (
                                    <>
                                        {" · "}
                                        <span className="font-semibold text-slate-700">{overall.doneH}</span>/{overall.totalH} hrs
                                    </>
                                )}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Across {syllabi.length} subject{syllabi.length === 1 ? "" : "s"}. Keep ticking topics to reach 100%.</p>
                        </div>
                    </div>

                    {/* Per-subject */}
                    {syllabi.map((s) => (
                        <SyllabusCard
                            key={s._id}
                            syllabus={s}
                            canManage={canManage(s)}
                            onToggle={handleToggle}
                            onEdit={(syl) => setEditor({ open: true, editing: syl })}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {editor.open && (
                <SyllabusEditorModal
                    open
                    editing={editor.editing}
                    onClose={() => setEditor({ open: false, editing: null })}
                    onSaved={load}
                />
            )}
        </div>
    );
}
