import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    FileText,
    MapPin,
    Wallet,
    Clock,
    Layers,
    Target,
    Building2,
    TrendingUp,
    CalendarDays,
    ExternalLink,
    PhoneCall,
    GraduationCap,
    Info,
    ArrowRight,
    ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getMyExamPatterns } from "@/Api/ExamPatternApi";
import { openCallback } from "@/lib/callback";

// Stable empty reference so "no exams selected" doesn't churn the useMemo below.
const EMPTY = [];

const DIFF = {
    Easy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    Moderate: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    Hard: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function DiffBadge({ level }) {
    if (!level) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    return (
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", DIFF[level] || "bg-slate-100 text-slate-600")}>
            {level}
        </span>
    );
}

// One compact "key fact" tile (eligibility, fees, marking, …).
function Fact({ icon, tint, label, value }) {
    if (!value) return null;
    const Icon = icon;
    return (
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700/70">
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tint)}>
                <Icon size={16} />
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm font-medium leading-snug text-slate-700 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon, children }) {
    const Icon = icon;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700/70">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Icon size={15} className="text-indigo-500" /> {title}
            </p>
            {children}
        </div>
    );
}

// Renders one full exam paper pattern.
function PatternDetail({ p }) {
    const marking =
        p.markingCorrect || p.markingNegative
            ? [p.markingCorrect && `${p.markingCorrect} correct`, p.markingNegative && `${p.markingNegative} wrong`]
                  .filter(Boolean)
                  .join(" · ")
            : "";
    const totals =
        p.totalQuestions || p.totalMarks
            ? [p.totalQuestions && `${p.totalQuestions} Qs`, p.totalMarks && `${p.totalMarks} marks`].filter(Boolean).join(" · ")
            : "";
    const hasSections = (p.sections || []).length > 0;
    const hasColleges = (p.topColleges || []).length > 0;

    return (
        <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-4"
        >
            {/* Header band */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                        <ScrollText size={12} /> Paper Pattern & Exam Guide
                    </span>
                    <h3 className="mt-2 text-xl font-bold leading-tight">{p.examName}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-indigo-100">
                        {p.conductingBody && (
                            <span className="inline-flex items-center gap-1">
                                <GraduationCap size={13} /> {p.conductingBody}
                            </span>
                        )}
                        {p.place && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin size={13} /> {p.place}
                            </span>
                        )}
                        {p.examMode && (
                            <span className="inline-flex items-center gap-1">
                                <FileText size={13} /> {p.examMode}
                            </span>
                        )}
                        {p.duration && (
                            <span className="inline-flex items-center gap-1">
                                <Clock size={13} /> {p.duration}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Key facts */}
            <div className="grid gap-3 sm:grid-cols-2">
                <Fact icon={GraduationCap} tint="bg-indigo-50 text-indigo-600" label="Eligibility" value={p.eligibility} />
                <Fact icon={Wallet} tint="bg-emerald-50 text-emerald-600" label="Application fees" value={p.fees} />
                <Fact icon={Target} tint="bg-violet-50 text-violet-600" label="Marking scheme" value={marking || p.markingNote} />
                <Fact icon={Layers} tint="bg-amber-50 text-amber-600" label="Total paper" value={totals} />
            </div>

            {/* Section-wise structure */}
            {hasSections && (
                <SectionCard title="Section-wise structure" icon={Layers}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[460px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                                    <th className="pb-2 pr-3 font-semibold">Section</th>
                                    <th className="pb-2 pr-3 font-semibold">Subjects / Topics</th>
                                    <th className="pb-2 pr-3 text-center font-semibold">Qs</th>
                                    <th className="pb-2 pr-3 text-center font-semibold">Marks</th>
                                    <th className="pb-2 text-center font-semibold">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {p.sections.map((s, i) => (
                                    <tr key={i}>
                                        <td className="py-2.5 pr-3 font-semibold text-slate-800 dark:text-slate-100">{s.name || "—"}</td>
                                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{s.subjects || "—"}</td>
                                        <td className="py-2.5 pr-3 text-center text-slate-600 dark:text-slate-300">{s.questions ?? "—"}</td>
                                        <td className="py-2.5 pr-3 text-center font-medium text-slate-700 dark:text-slate-200">{s.marks ?? "—"}</td>
                                        <td className="py-2.5 text-center"><DiffBadge level={s.difficulty} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            )}

            {/* Placement + top colleges */}
            {(hasColleges || p.avgPlacement) && (
                <SectionCard title="Where it can take you" icon={TrendingUp}>
                    {p.avgPlacement && (
                        <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-500/10">
                            <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-slate-600 dark:text-slate-300">Avg. placement</span>
                            <span className="ml-auto font-bold text-emerald-700 dark:text-emerald-300">{p.avgPlacement}</span>
                        </div>
                    )}
                    {hasColleges && (
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {p.topColleges.map((c, i) => (
                                <li key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <Building2 size={14} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
                                        <p className="truncate text-xs text-slate-400">
                                            {[c.location, c.avgPackage && `~${c.avgPackage}`].filter(Boolean).join(" · ")}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            )}

            {/* Dates / website / notes */}
            {(p.importantDates || p.officialWebsite) && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Fact icon={CalendarDays} tint="bg-indigo-50 text-indigo-600" label="Important dates" value={p.importantDates} />
                    {p.officialWebsite && (
                        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700/70">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                                <ExternalLink size={16} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Official website</p>
                                <a
                                    href={/^https?:\/\//.test(p.officialWebsite) ? p.officialWebsite : `https://${p.officialWebsite}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-0.5 block truncate text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {p.officialWebsite}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {p.notes && (
                <div className="flex gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-sm text-slate-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-slate-300">
                    <Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                    <p className="whitespace-pre-line leading-relaxed">{p.notes}</p>
                </div>
            )}

            {/* Callback CTA */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center sm:flex-row sm:text-left dark:border-slate-700/70 dark:bg-slate-800/40">
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Still have questions about this exam?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Talk to our team — we&apos;ll call you back and clear your doubts.</p>
                </div>
                <button
                    onClick={openCallback}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                    <PhoneCall size={15} /> Request a callback
                </button>
            </div>
        </motion.div>
    );
}

// Dashboard section: the paper pattern(s) for the exam(s) the student picked in
// their profile. Handles "no exam picked", "not published yet" and multi-exam
// (a pill switcher) states.
export default function ExamPatternSection() {
    const { user } = useAuth();
    const [fetched, setFetched] = useState(null);
    const [active, setActive] = useState(0);

    const hasExams = (user?.exams?.length || 0) > 0;

    useEffect(() => {
        if (!hasExams) return; // nothing to fetch — "no exams" is derived below
        let alive = true;
        getMyExamPatterns()
            .then((rows) => alive && setFetched(rows))
            .catch(() => alive && setFetched([]));
        return () => {
            alive = false;
        };
    }, [hasExams]);

    // A student with no exams has no patterns (no fetch, no setState-in-effect);
    // otherwise it's whatever we fetched (null while still loading).
    const patterns = hasExams ? fetched : EMPTY;

    const current = useMemo(() => {
        if (!patterns || patterns.length === 0) return null;
        return patterns[Math.min(active, patterns.length - 1)];
    }, [patterns, active]);

    // Never show anything until we know the outcome (keeps the dashboard calm).
    if (patterns === null) return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <ScrollText size={16} />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-slate-800">Exam Paper Pattern</h2>
                    <p className="text-xs text-slate-400">Everything about the exam you&apos;re preparing for.</p>
                </div>
            </div>

            {!hasExams ? (
                <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                >
                    <Target size={18} className="shrink-0 text-indigo-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Pick the LEET exams you&apos;re preparing for in your profile to see their full paper pattern here.
                    </p>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-indigo-400" />
                </Link>
            ) : patterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center dark:border-slate-700">
                    <ScrollText className="mb-2 h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pattern coming soon</p>
                    <p className="mt-0.5 max-w-sm text-xs text-slate-400">
                        We&apos;re preparing the detailed paper pattern for your exam. Have a question in the meantime?
                    </p>
                    <button
                        onClick={openCallback}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        <PhoneCall size={13} /> Request a callback
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {patterns.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {patterns.map((p, i) => (
                                <button
                                    key={p._id}
                                    onClick={() => setActive(i)}
                                    className={cn(
                                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                        i === Math.min(active, patterns.length - 1)
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    )}
                                >
                                    {p.examName}
                                </button>
                            ))}
                        </div>
                    )}
                    {current && <PatternDetail p={current} />}
                </div>
            )}
        </div>
    );
}
