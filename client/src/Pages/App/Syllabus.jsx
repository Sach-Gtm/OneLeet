import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Clock,
    CheckCircle2,
    Circle,
    BookOpen,
    Loader2,
    GraduationCap,
    Layers,
    Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getSyllabi, toggleTopic } from "@/Api/SyllabusApi";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";

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

// Brand-first gradient pairs, cycled per card so each subject reads distinct.
const RINGS = [
    ["#3fb0d6", "#147a9e"],
    ["#ec7a54", "#cb4826"],
    ["#8b5cf6", "#6366f1"],
    ["#10b981", "#0ea5e9"],
    ["#f59e0b", "#f97316"],
];

// An animated progress ring. Re-animates whenever `value` changes (e.g. a topic
// is ticked), so ticking a topic visibly fills the ring.
function Ring({ value = 0, size = 58, stroke = 6, gradId, colors = RINGS[0] }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
    const big = size >= 100;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    className="text-slate-100 dark:text-slate-700"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: off }}
                    transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                />
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={colors[0]} />
                        <stop offset="100%" stopColor={colors[1]} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-bold text-slate-900", big ? "text-2xl" : "text-[13px]")}>{value}%</span>
                {big && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">covered</span>
                )}
            </div>
        </div>
    );
}

function SyllabusCard({ syllabus, index, onToggle, onLocked }) {
    const [open, setOpen] = useState(false);
    const locked = !!syllabus.locked;
    const completedSet = useMemo(
        () => new Set((syllabus.completedTopics || []).map(String)),
        [syllabus.completedTopics]
    );
    // A locked premium syllabus ships with no chapters, but the server still sends
    // its size in `progress` — use that so the card stays enticing (X topics · Y hrs).
    const sp = syllabus.progress || {};
    const prog = locked
        ? { total: sp.totalTopics || 0, done: 0, totalH: sp.totalHours || 0, doneH: 0, percent: 0 }
        : computeProgress(syllabus.chapters, completedSet);
    // Show only the subject name (drop the long "LEET Engineering…" title).
    const name = syllabus.subject || syllabus.title;
    const colors = RINGS[index % RINGS.length];
    const gradId = `syl-ring-${index}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.05 }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700"
        >
            <button
                onClick={() => (locked ? onLocked(syllabus) : setOpen((o) => !o))}
                className="flex w-full items-center gap-4 p-5 text-left"
            >
                <Ring value={prog.percent} gradId={gradId} colors={colors} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900">{name}</h3>
                        {!syllabus.published && (
                            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                Draft
                            </span>
                        )}
                        {syllabus.premium && <PremiumBadge locked={locked} />}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                        {!locked && (
                            <>
                                <span className="inline-flex items-center gap-1">
                                    <Layers size={12} /> {(syllabus.chapters || []).length} chapter
                                    {(syllabus.chapters || []).length === 1 ? "" : "s"}
                                </span>
                                ·{" "}
                            </>
                        )}
                        {prog.total} topic{prog.total === 1 ? "" : "s"} ·{" "}
                        <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {prog.totalH} hrs
                        </span>
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${prog.percent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                            {prog.done}/{prog.total}
                        </span>
                    </div>
                </div>
                {locked ? (
                    <Lock className="shrink-0 text-amber-500" size={18} />
                ) : (
                    <ChevronDown className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} size={18} />
                )}
            </button>

            <AnimatePresence initial={false}>
                {open && !locked && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 border-t border-slate-100 p-5 pt-4 dark:border-slate-700">
                            {(syllabus.chapters || []).length === 0 ? (
                                <p className="text-sm text-slate-400">No chapters in this syllabus yet.</p>
                            ) : (
                                (syllabus.chapters || []).map((ch, ci) => {
                                    const chTopics = ch.topics || [];
                                    const chDone = chTopics.filter((t) => completedSet.has(String(t._id))).length;
                                    return (
                                        <div key={ch._id || ci}>
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <h4 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-600 dark:bg-slate-800">
                                                        {ci + 1}
                                                    </span>
                                                    <span className="truncate">{ch.title}</span>
                                                </h4>
                                                <span className="shrink-0 text-xs font-medium text-slate-400">
                                                    {chDone}/{chTopics.length}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {chTopics.map((t) => {
                                                    const done = completedSet.has(String(t._id));
                                                    return (
                                                        <button
                                                            key={t._id}
                                                            onClick={() => onToggle(syllabus._id, t._id, !done)}
                                                            className={cn(
                                                                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                                                                done
                                                                    ? "border-emerald-200 bg-emerald-50"
                                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {done ? (
                                                                <motion.span
                                                                    initial={{ scale: 0.5 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                                                    className="shrink-0"
                                                                >
                                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                                </motion.span>
                                                            ) : (
                                                                <Circle size={18} className="shrink-0 text-slate-300" />
                                                            )}
                                                            <span className={cn("flex-1 text-sm", done ? "text-slate-400 line-through" : "text-slate-700")}>
                                                                {t.title}
                                                            </span>
                                                            {t.estimatedHours > 0 && (
                                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800">
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
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function Syllabus() {
    const [syllabi, setSyllabi] = useState(null);
    const [gate, setGate] = useState(null); // premium syllabus a free student tapped

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
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-5"
            >
                <h1 className="text-2xl font-bold text-slate-900">Syllabus Tracker</h1>
                <p className="text-sm text-slate-500">Tick off topics as you finish them and watch your coverage grow.</p>
            </motion.div>

            {syllabi === null ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
            ) : syllabi.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
                    <BookOpen className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No syllabus yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Your mentors will publish subject syllabi here soon.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Overall coverage */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900"
                    >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />
                        <div className="relative flex items-center gap-6">
                            <Ring value={overall.percent} size={120} stroke={10} gradId="syl-ring-overall" />
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
                                <p className="mt-1 text-xs text-slate-400">
                                    Across {syllabi.length} subject{syllabi.length === 1 ? "" : "s"}. Keep ticking topics to reach 100%.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Per-subject */}
                    {syllabi.map((s, i) => (
                        <SyllabusCard key={s._id} syllabus={s} index={i} onToggle={handleToggle} onLocked={setGate} />
                    ))}
                </div>
            )}

            <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.subject || gate?.title} />
        </div>
    );
}
