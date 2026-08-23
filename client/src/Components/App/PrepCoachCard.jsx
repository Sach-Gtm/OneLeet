import { Link } from "react-router-dom";
import { Compass, CheckCircle2, ArrowRight, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASES, PHASE_STYLES, phaseForDays } from "@/lib/prepGuide";
import { useExamCountdown } from "@/lib/useExamCountdown";

// Compact dashboard entry point to the full Prep Guide. Surfaces the phase the
// student is in right now — derived live from their exam countdown — with its
// focus and a couple of tips, plus a mini roadmap of all the phases ahead.
export default function PrepCoachCard() {
    const countdown = useExamCountdown();
    const daysLeft = countdown?.daysLeft ?? null;
    const currentId = phaseForDays(daysLeft);
    const current = PHASES.find((p) => p.id === currentId) || PHASES[0];
    const s = PHASE_STYLES[current.color] || PHASE_STYLES.indigo;
    const Icon = current.icon;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Compass size={16} />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Your Prep Roadmap</h2>
                        <p className="text-xs text-slate-400">What to focus on right now, and next.</p>
                    </div>
                </div>
                <Link
                    to="/prep-guide"
                    className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 sm:inline-flex"
                >
                    Full guide <ArrowRight size={13} />
                </Link>
            </div>

            {/* Current phase highlight */}
            <div className="mt-4 flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", s.chip)}>
                    <Icon size={18} />
                </span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{current.label} phase</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {daysLeft != null && <CalendarClock size={10} />}
                            {daysLeft == null
                                ? current.window
                                : daysLeft === 0
                                  ? "Exam is today!"
                                  : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`}
                        </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{current.focus}</p>
                    <ul className="mt-2 space-y-1.5">
                        {current.tips.slice(0, 2).map((t, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                                <span>{t}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Mini roadmap of all phases */}
            <div className="mt-4 flex items-center">
                {PHASES.map((p, i) => (
                    <div key={p.id} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <span
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    p.id === currentId ? PHASE_STYLES[p.color].dot : "bg-slate-200 dark:bg-slate-700"
                                )}
                            />
                            <span className={cn("text-[10px] font-medium", p.id === currentId ? "text-slate-700 dark:text-slate-200" : "text-slate-400")}>
                                {p.label}
                            </span>
                        </div>
                        {i < PHASES.length - 1 && <span className="mb-4 h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
                    </div>
                ))}
            </div>

            <Link
                to="/prep-guide"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:hidden dark:bg-indigo-600 dark:hover:bg-indigo-500"
            >
                See your full roadmap <ArrowRight size={15} />
            </Link>
        </div>
    );
}
