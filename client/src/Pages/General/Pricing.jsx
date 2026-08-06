import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Check, Clock, ArrowRight, GraduationCap } from "lucide-react";

// Placeholder pricing page — the paid batch isn't self-serve yet. It sets
// expectations (free to explore, premium for the full batch) and routes people
// to enroll free now; real checkout lands here later.
const FREE = [
    "Enroll in any batch — free",
    "Exam pattern, eligibility & syllabus",
    "Seat matrix & previous-year cut-offs",
    "Sample past papers to explore",
    "Free daily practice",
];
const PREMIUM = [
    "Every solved past paper (PYQ)",
    "Weekly full-length mocks with an All-India rank",
    "Premium chapter notes & DPP",
    "A live doubt class every week + a few 1:1 sessions",
    "AI weak-topic analysis & college predictor",
];

function Plan({ title, price, note, perks, highlight, cta }) {
    return (
        <div
            className={
                "flex flex-col rounded-2xl border p-6 " +
                (highlight
                    ? "border-indigo-300 bg-white shadow-xl shadow-indigo-500/10 dark:border-indigo-500/40 dark:bg-slate-900"
                    : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60")
            }
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                {highlight && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                        <Sparkles size={12} /> Batch
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{price}</span>
                {note && <span className="text-sm text-slate-400">{note}</span>}
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
                {perks.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span>{p}</span>
                    </li>
                ))}
            </ul>
            {cta}
        </div>
    );
}

export default function Pricing() {
    return (
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Clock size={13} /> Self-serve checkout is coming soon
                </span>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Simple pricing, honest value
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                    Coaching mafias charge ₹18–25k for a LEET batch. Ours is built by someone who
                    cleared it — enrolling is free today, and the full batch stays a fraction of that
                    price. Payments open here shortly.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-10 grid gap-5 sm:grid-cols-2"
            >
                <Plan
                    title="Free"
                    price="₹0"
                    note="forever"
                    perks={FREE}
                    cta={
                        <Link
                            to="/courses"
                            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <GraduationCap size={16} /> Browse batches
                        </Link>
                    }
                />
                <Plan
                    title="Premium batch"
                    price="₹2,999"
                    note="/ cycle · was ₹4,999"
                    perks={PREMIUM}
                    highlight
                    cta={
                        <button
                            disabled
                            className="mt-6 inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-indigo-600/80 px-4 py-2.5 text-sm font-semibold text-white opacity-90"
                        >
                            <Clock size={16} /> Payments opening soon
                        </button>
                    }
                />
            </motion.div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-5 text-center dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Want in early? Enroll in your batch now — it&apos;s free — and you&apos;ll be first to
                    unlock premium when it opens.
                </p>
                <Link
                    to="/courses"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                    See the batches <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
}
