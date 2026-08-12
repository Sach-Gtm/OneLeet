import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Compass,
    CheckCircle2,
    AlertTriangle,
    Backpack,
    PhoneCall,
    ScrollText,
    ArrowRight,
    ArrowLeft,
    CalendarClock,
    Lock,
    Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TopoLines from "@/Components/General/TopoLines";
import { PHASES, MISTAKES, EXAM_DAY_KIT, PHASE_STYLES, phaseForDays } from "@/lib/prepGuide";
import { useExamCountdown } from "@/lib/useExamCountdown";
import { openCallback } from "@/lib/callback";
import { useAuth } from "@/context/AuthContext";
import { canAccessPremiumContent, isStaff } from "@/lib/roles";
import ProtectedContent from "@/Components/Security/ProtectedContent";
import { useSeo } from "@/lib/useSeo";

const reveal = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, ease: "easeOut" },
};

function PhaseNode({ phase, last, current, windowLabel }) {
    const Icon = phase.icon;
    const s = PHASE_STYLES[phase.color] || PHASE_STYLES.indigo;
    return (
        <motion.div {...reveal} className="relative flex gap-4 pb-6">
            {/* Connecting line */}
            {!last && <span className="absolute left-[22px] top-12 h-full w-px bg-slate-200 dark:bg-slate-700" />}
            {/* Node */}
            <span
                className={cn(
                    "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                    s.chip,
                    current && cn("ring-4", s.ring)
                )}
            >
                <Icon size={19} />
            </span>
            <div
                className={cn(
                    "min-w-0 flex-1 rounded-2xl border bg-white p-4",
                    current
                        ? "border-indigo-200 shadow-sm dark:border-indigo-500/30"
                        : "border-slate-200 dark:border-slate-700/70"
                )}
            >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{phase.label}</h3>
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            current
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}
                    >
                        {current && windowLabel && <CalendarClock size={10} />}
                        {current && windowLabel ? windowLabel : phase.window}
                    </span>
                    {current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">You&apos;re here</span>}
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{phase.focus}</p>
                <ul className="mt-3 space-y-2">
                    {phase.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle2 size={15} className={cn("mt-0.5 shrink-0", s.chip.split(" ")[1])} />
                            <span>{t}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}

// Before login: a limited public taste — the roadmap phases at a glance and a
// couple of mistakes — with a sign-up CTA for the full day-by-day plan. (The
// full tips, all mistakes, exam-day kit and 1:1 coaching are behind sign-up.)
function PrepGuidePublicTeaser({ currentId }) {
    return (
        <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-28 sm:pt-32">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white sm:p-8"
            >
                <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        <Compass size={13} /> Free Prep Guide
                    </span>
                    <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your roadmap to cracking LEET</h1>
                    <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
                        A clear stage-by-stage plan from the first month to exam day. Here&apos;s the
                        overview. Create a free account to unlock the full day-by-day tips, the mistakes
                        that cost marks and your exam-day checklist.
                    </p>
                </div>
            </motion.div>

            {/* Phase overview (focuses only — the detailed tips are behind sign-up). */}
            <div className="space-y-3">
                {PHASES.map((p) => {
                    const s = PHASE_STYLES[p.color] || PHASE_STYLES.indigo;
                    const Icon = p.icon;
                    return (
                        <div key={p.id} className={cn("flex items-start gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-800/40", p.id === currentId ? "border-indigo-200 dark:border-indigo-500/30" : "border-slate-200 dark:border-slate-700/70")}>
                            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", s.chip)}>
                                <Icon size={18} />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.label}</h3>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{p.window}</span>
                                </div>
                                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{p.focus}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sign-up CTA */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10">
                <Lock className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                <div>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100">Unlock the full plan, free</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Sign up (no course needed) to get the day-by-day tips for every stage, the full
                        mistakes list and your exam-day kit.
                    </p>
                </div>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                    Create a free account <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}

export default function PrepGuide() {
    const { user } = useAuth();
    const countdown = useExamCountdown();

    useSeo({
        title: "How to Prepare for LEET: Free Study Plan & Roadmap | OneLeet",
        description: "A stage-by-stage LEET preparation roadmap for diploma students, from your first month to exam day. Free overview; unlock the full day-by-day plan.",
        path: "/prep-guide",
    });

    const daysLeft = countdown?.daysLeft ?? null;
    const currentId = phaseForDays(daysLeft);
    const windowLabel =
        daysLeft == null ? null : daysLeft === 0 ? "Exam is today!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`;

    // Tiered access, per spec:
    //   • before login → a limited public teaser (roadmap overview + a taste)
    //   • logged-in free → the full written guide (roadmap, mistakes, exam-day kit)
    //   • premium → all that PLUS 1:1 mentor coaching (the block at the end)
    const premium = canAccessPremiumContent(user);
    if (!user) {
        return <PrepGuidePublicTeaser currentId={currentId} />;
    }

    return (
        <ProtectedContent
            enabled={!isStaff(user)}
            contentType="prep-guide"
            contentRef="Prep Guide"
            className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:pt-32"
        >
        <div className="space-y-8 pb-4">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white sm:p-8"
            >
                <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            <Compass size={13} /> Prep Guide
                        </span>
                        {windowLabel && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                                <CalendarClock size={13} /> {windowLabel}
                                {countdown?.examName ? ` · ${countdown.examName}` : ""}
                            </span>
                        )}
                    </div>
                    <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Your roadmap to cracking LEET</h1>
                    <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
                        {daysLeft == null
                            ? "You're at the start of your journey, perfect timing. Here's exactly what to focus on at each stage, the mistakes to avoid, and what to carry on exam day."
                            : "Here's exactly what to focus on for where you are now, the mistakes to avoid, and what to carry on exam day."}
                    </p>
                </div>
            </motion.div>

            {/* Roadmap */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <ScrollText size={16} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">The phases, start to finish</h2>
                        <p className="text-xs text-slate-400">What to prioritise as your exam gets closer.</p>
                    </div>
                </div>
                <div>
                    {PHASES.map((p, i) => (
                        <PhaseNode
                            key={p.id}
                            phase={p}
                            last={i === PHASES.length - 1}
                            current={p.id === currentId}
                            windowLabel={windowLabel}
                        />
                    ))}
                </div>
            </section>

            {/* Mistakes to avoid */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15">
                        <AlertTriangle size={16} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Mistakes to avoid</h2>
                        <p className="text-xs text-slate-400">The traps that quietly cost the most marks.</p>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {MISTAKES.map((m, i) => (
                        <motion.div
                            {...reveal}
                            transition={{ ...reveal.transition, delay: (i % 2) * 0.05 }}
                            key={m.title}
                            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700/70"
                        >
                            <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                                    <AlertTriangle size={11} />
                                </span>
                                {m.title}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{m.body}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Exam-day kit */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                        <Backpack size={16} />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">What to carry on exam day</h2>
                        <p className="text-xs text-slate-400">Pack it the night before. Always follow your admit card too.</p>
                    </div>
                </div>
                <motion.ul {...reveal} className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-slate-700/70">
                    {EXAM_DAY_KIT.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                            {item}
                        </li>
                    ))}
                </motion.ul>
            </section>

            {/* Callback CTA */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:flex-row sm:text-left dark:border-slate-700/70 dark:bg-slate-800/40">
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Stuck or unsure where to start?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Get a free call with our team. We&apos;ll help you build a plan that fits your timeline.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/syllabus"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        Start with Syllabus <ArrowRight size={14} />
                    </Link>
                    <button
                        onClick={openCallback}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                    >
                        <PhoneCall size={15} /> Request a callback
                    </button>
                </div>
            </div>

            {/* Premium coaching — the 1:1 tier. Active for premium; a locked
                upsell for free students (the "30% + 1:1" part of the guide). */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white dark:border-indigo-500/30">
                <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        <Crown size={13} /> Premium coaching
                    </span>
                    <h2 className="mt-3 text-xl font-bold">1:1 mentor strategy sessions</h2>
                    <p className="mt-1 max-w-xl text-sm text-indigo-100">
                        A personalised plan built around your rank goal and weak topics, plus limited
                        one-on-one calls with a mentor who cleared LEET, part of the premium batch.
                    </p>
                    <div className="mt-4">
                        {premium ? (
                            <button
                                onClick={openCallback}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                            >
                                <PhoneCall size={16} /> Book your 1:1 session
                            </button>
                        ) : (
                            <Link
                                to="/pricing"
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
                            >
                                <Lock size={15} /> Unlock 1:1 coaching
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </ProtectedContent>
    );
}
