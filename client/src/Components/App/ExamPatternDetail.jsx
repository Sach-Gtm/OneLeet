import { useState } from "react";
import { Link } from "react-router-dom";
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
    CalendarClock,
    ExternalLink,
    PhoneCall,
    GraduationCap,
    Info,
    ArrowRight,
    ScrollText,
    Armchair,
    TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TopoLines from "@/Components/General/TopoLines";
import { daysUntil } from "@/lib/useExamCountdown";
import { openCallback } from "@/lib/callback";
import SeatMatrixModal from "@/Components/App/SeatMatrixModal";
import CutoffModal from "@/Components/App/CutoffModal";

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
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700/70 dark:bg-slate-800/40">
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

function SectionCard({ title, icon, right, children }) {
    const Icon = icon;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/40">
            <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <Icon size={15} className="text-indigo-500" /> {title}
                </p>
                {right}
            </div>
            {children}
        </div>
    );
}

// The blue "identity" band for an exam — badge, name, place/mode/duration chips
// and a days-to-go pill. Shared by the full page and the dashboard card.
export function PatternHeaderBand({ p, children }) {
    const daysLeft = daysUntil(p.examDate);
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white">
            <TopoLines color="rgb(255 255 255)" opacity={0.1} />
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
            <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                        <ScrollText size={12} /> Paper Pattern & Exam Guide
                    </span>
                    {daysLeft != null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950">
                            <CalendarClock size={12} />
                            {daysLeft === 0 ? "Exam is today!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`}
                        </span>
                    )}
                </div>
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
                {children}
            </div>
        </div>
    );
}

// Dashboard entry point: the blue band as a clickable card that deep-links to
// the full pattern page for this exam. This is the ONLY exam-pattern content on
// the dashboard — everything else lives on /exam-pattern.
export function ExamPatternCard({ p }) {
    return (
        <Link
            to={`/exam-pattern?exam=${encodeURIComponent(p.examCode)}`}
            className="group block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
            <PatternHeaderBand p={p}>
                <div className="mt-3 flex items-center gap-1.5 border-t border-white/15 pt-3 text-sm font-semibold text-white">
                    View full pattern, seat intake &amp; colleges
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </div>
            </PatternHeaderBand>
        </Link>
    );
}

// Seat intake table — university-wise seats offered through this exam, with a
// total so the student sees the overall size of the intake.
function SeatIntakeSection({ rows }) {
    const list = (rows || []).filter((s) => s && (s.college || s.seats != null));
    if (list.length === 0) return null;
    const total = list.reduce((sum, s) => sum + (Number(s.seats) || 0), 0);
    return (
        <SectionCard
            title="University-wise seat intake"
            icon={Armchair}
            right={
                total > 0 ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {total.toLocaleString("en-IN")} seats
                    </span>
                ) : null
            }
        >
            <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                            <th className="pb-2 pr-3 font-semibold">College / University</th>
                            <th className="pb-2 pr-3 font-semibold">Course / Branch</th>
                            <th className="pb-2 text-right font-semibold">Seats</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {list.map((s, i) => (
                            <tr key={i}>
                                <td className="py-2.5 pr-3 font-semibold text-slate-800 dark:text-slate-100">
                                    {s.college || "—"}
                                    {s.note && <span className="ml-1 text-xs font-normal text-slate-400">({s.note})</span>}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{s.course || "—"}</td>
                                <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                                    {s.seats != null ? Number(s.seats).toLocaleString("en-IN") : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
}

// The full paper pattern for one exam: identity band + key facts + section-wise
// structure + seat intake + colleges/placement + dates + notes + a callback CTA.
export default function PatternDetail({ p, hasMatrix = false, hasCutoffs = false }) {
    const [matrixOpen, setMatrixOpen] = useState(false);
    const [cutoffOpen, setCutoffOpen] = useState(false);
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
        <div className="space-y-4">
            <PatternHeaderBand p={p} />

            {/* Key facts */}
            <div className="grid gap-3 sm:grid-cols-2">
                <Fact icon={GraduationCap} tint="bg-indigo-50 text-indigo-600" label="Eligibility" value={p.eligibility} />
                <Fact icon={Wallet} tint="bg-emerald-50 text-emerald-600" label="Application fees" value={p.fees} />
                <Fact icon={Target} tint="bg-violet-50 text-violet-600" label="Marking scheme" value={marking || p.markingNote} />
                <Fact icon={Layers} tint="bg-amber-50 text-amber-600" label="Total paper" value={totals} />
            </div>

            {/* College-wise seat matrix — opens the searchable full matrix. */}
            {hasMatrix && (
                <button
                    onClick={() => setMatrixOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-left transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                        <Armchair size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">College-wise Seat Matrix</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Every college, branch &amp; seat count (General + Management Quota) for this exam.
                        </p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-indigo-400" />
                </button>
            )}

            {/* Round-wise counseling cut-offs. */}
            {hasCutoffs && (
                <button
                    onClick={() => setCutoffOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
                        <TrendingDown size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Cut-offs &amp; College Predictor</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Round-wise closing ranks — enter your rank to see which colleges you&apos;d get.
                        </p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-emerald-500" />
                </button>
            )}

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

            {/* University-wise seat intake */}
            <SeatIntakeSection rows={p.seatIntake} />

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

            {/* Dates / website */}
            {(p.importantDates || p.officialWebsite) && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Fact icon={CalendarDays} tint="bg-indigo-50 text-indigo-600" label="Important dates" value={p.importantDates} />
                    {p.officialWebsite && (
                        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700/70 dark:bg-slate-800/40">
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

            {matrixOpen && (
                <SeatMatrixModal
                    examCode={p.examCode}
                    examName={p.examName}
                    onClose={() => setMatrixOpen(false)}
                />
            )}

            {cutoffOpen && (
                <CutoffModal
                    examCode={p.examCode}
                    examName={p.examName}
                    onClose={() => setCutoffOpen(false)}
                />
            )}
        </div>
    );
}
