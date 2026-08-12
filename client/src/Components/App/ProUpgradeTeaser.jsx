import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Crown, Target, Brain, Infinity as InfinityIcon, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown to FREE students only (premium already has the perks strip). Turns the
// dashboard into a clear "basic vs Pro" story: attractive, locked previews of
// what a Pro membership unlocks, with a single CTA to Pricing. Mirrors the
// premium plan features in data/pricing.js.
const PRO_FEATURES = [
    {
        icon: Target,
        title: "Rank & College Predictor Pro",
        desc: "Expected rank, category-wise, with safe / dream / backup colleges.",
        color: "from-rose-500 to-orange-500",
    },
    {
        icon: Brain,
        title: "AI weak-topic analysis",
        desc: "A personalised revision plan built from the mistakes you actually make.",
        color: "from-indigo-500 to-violet-500",
    },
    {
        icon: InfinityIcon,
        title: "Unlimited mocks & full PYQ library",
        desc: "The complete test series plus year / subject / topic-wise PYQs with keys.",
        color: "from-sky-500 to-cyan-500",
    },
    {
        icon: Users,
        title: "1:1 mentor support",
        desc: "Live doubt sessions, mentorship and premium 6-hour WhatsApp support.",
        color: "from-emerald-500 to-teal-500",
    },
];

export default function ProUpgradeTeaser() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-6 dark:border-amber-400/20 dark:from-amber-500/[0.07] dark:via-slate-900 dark:to-violet-500/10"
        >
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <motion.span
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                    >
                        <Crown size={21} />
                    </motion.span>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            Unlock everything with Pro
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            You&apos;re on the Free plan — here&apos;s what Pro adds to your prep.
                        </p>
                    </div>
                </div>
                <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition hover:scale-[1.03] active:scale-[0.98]"
                >
                    See Pro plans <ArrowRight size={15} />
                </Link>
            </div>

            <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                {PRO_FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                            className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"
                        >
                            <span
                                className={cn(
                                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                                    f.color
                                )}
                            >
                                <Icon size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{f.title}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {f.desc}
                                </p>
                            </div>
                            <Lock
                                size={14}
                                className="shrink-0 text-slate-300 transition group-hover:text-amber-500 dark:text-slate-600"
                            />
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
