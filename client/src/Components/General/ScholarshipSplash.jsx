import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, CalendarDays, Monitor, BadgeCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { track } from "@/lib/telemetry";

// Promo splash for the All-India Scholarship Test. Rendered inside Home, so it
// re-appears every time a visitor lands on the home screen (and never on other
// pages) — dismissible per visit. Auto-retires after the event so it can never
// linger as a stale promo. Edit EVENT_DATE / HIDE_AFTER to reuse for a new test.
const EVENT_DATE = "30 Aug 2026";
// Stops showing after the test day (end of 30 Aug 2026, IST).
const HIDE_AFTER = new Date("2026-08-30T23:59:59+05:30").getTime();

export default function ScholarshipSplash() {
    const [open, setOpen] = useState(false);
    const { isAuthenticated } = useAuth();

    // Show shortly after the home screen paints (grabs attention without a jarring
    // flash before first paint). Fresh state on every mount → re-shows on return.
    useEffect(() => {
        if (Date.now() > HIDE_AFTER) return;
        const t = setTimeout(() => {
            setOpen(true);
            track("scholarship_splash_view");
        }, 500);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const cta = isAuthenticated
        ? { label: "See the scholarship batch", to: "/courses" }
        : { label: "Register free now", to: "/register" };

    const detail = [
        { icon: CalendarDays, text: EVENT_DATE },
        { icon: Monitor, text: "Online mode" },
        { icon: BadgeCheck, text: "Free registration" },
    ];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[95] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="All-India Scholarship Test"
                        initial={{ opacity: 0, scale: 0.9, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
                    >
                        <button
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                            className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white dark:bg-slate-800/85 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <X size={18} />
                        </button>

                        {/* Offer band — inline sRGB gradient (avoids the muddy OKLCH render). */}
                        <div
                            className="relative overflow-hidden px-6 pb-7 pt-8 text-center text-white"
                            style={{ backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)" }}
                        >
                            <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur">
                                <Trophy className="h-3.5 w-3.5" /> All-India Scholarship Test
                            </span>
                            <h2 className="mt-4 text-[34px] font-extrabold leading-none tracking-tight sm:text-4xl">
                                Up to <span className="rounded-lg bg-amber-300 px-2 py-0.5 text-slate-900">100% OFF</span>
                            </h2>
                            <p className="mx-auto mt-3 max-w-xs text-[15px] font-medium leading-snug text-white/95">
                                A <b>₹25,000</b> LEET course — yours for just <b>₹499</b>, or <b>100% FREE</b> based on your rank.
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-6 pt-5 text-center">
                            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <Sparkles className="h-4 w-4 text-amber-500" /> Take the test. Rank. Get full funding.
                            </p>
                            <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                                One common exam, one all-India rank. The higher you rank, the bigger your scholarship.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                {detail.map((d) => {
                                    const Icon = d.icon;
                                    return (
                                        <span key={d.text} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            <Icon className="h-3.5 w-3.5 text-indigo-500" /> {d.text}
                                        </span>
                                    );
                                })}
                            </div>

                            <Link
                                to={cta.to}
                                onClick={() => {
                                    track("scholarship_splash_cta");
                                    setOpen(false);
                                }}
                                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:scale-[1.02] active:scale-[0.98]"
                                style={{ backgroundImage: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
                            >
                                {cta.label}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>

                            <button
                                onClick={() => setOpen(false)}
                                className="mt-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                Maybe later
                            </button>

                            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Get funded · Get selected · Compete nationally
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
