import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Camera, GraduationCap, ClipboardCheck, CheckCircle2, ArrowRight, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

// A guided setup card for new / free students, so a brand-new dashboard reads as
// "here's your next step" instead of a wall of zeros. Every step is derived from
// real data and links to where it's done; the card animates its progress and
// self-hides once all four steps are complete.
export default function GetStartedChecklist({ user, stats }) {
    const steps = [
        {
            key: "photo",
            label: "Complete your profile",
            desc: "Add your passport photo",
            to: "/profile",
            icon: Camera,
            done: !!user?.passportPhoto?.url,
        },
        {
            key: "batch",
            label: "Enroll in your batch",
            desc: "Pick your college-wise batch",
            to: "/courses",
            icon: GraduationCap,
            done: Array.isArray(user?.exams) && user.exams.length > 0,
        },
        {
            key: "test",
            label: "Take your first mock test",
            desc: "See exactly where you stand",
            to: "/tests",
            icon: ClipboardCheck,
            done: (stats?.testsTaken || 0) > 0,
        },
        {
            key: "pyq",
            label: "Solve 10 PYQs",
            desc: "Build the daily habit",
            to: "/pyqs",
            icon: CheckCircle2,
            done: (stats?.pyqsSolved || 0) >= 10,
        },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    const pct = Math.round((doneCount / steps.length) * 100);
    if (doneCount === steps.length) return null; // fully set up — nothing to nudge

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                        <Rocket size={19} />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Get started</h2>
                        <p className="text-xs text-slate-400">
                            {doneCount} of {steps.length} done — finish setup to get the most out of OneLeet
                        </p>
                    </div>
                </div>
                <span className="text-xl font-bold text-indigo-600 tabular-nums dark:text-indigo-400">{pct}%</span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {steps.map((s, i) => {
                    const Icon = s.done ? Check : s.icon;
                    return (
                        <motion.div
                            key={s.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
                        >
                            <Link
                                to={s.to}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl border p-3 transition",
                                    s.done
                                        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                                )}
                            >
                                <span
                                    className={cn(
                                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition",
                                        s.done
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                                    )}
                                >
                                    <Icon size={16} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            "text-sm font-semibold",
                                            s.done
                                                ? "text-emerald-700 dark:text-emerald-300"
                                                : "text-slate-700 dark:text-slate-200"
                                        )}
                                    >
                                        {s.label}
                                    </p>
                                    <p className="text-xs text-slate-400">{s.done ? "Done" : s.desc}</p>
                                </div>
                                {!s.done && (
                                    <ArrowRight
                                        size={15}
                                        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
