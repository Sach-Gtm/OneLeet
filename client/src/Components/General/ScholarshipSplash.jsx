import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, CalendarDays, Monitor, BadgeCheck, ArrowRight, Sparkles, Flame } from "lucide-react";
import { track } from "@/lib/telemetry";
import { useScholarshipCount } from "@/lib/useScholarshipCount";
import { SCHOLARSHIP_TEST_DATE, SCHOLARSHIP_HIDE_AFTER } from "@/config/launch";

// Promo splash for the All-India Scholarship Test. Rendered inside Home, so it
// re-appears every time a visitor lands on the home screen (and never on other
// pages) — dismissible per visit. Auto-retires after the event (SCHOLARSHIP_HIDE_AFTER
// in config/launch) so it can never linger as a stale promo. The CTA opens the
// dedicated /scholarship registration page directly (for everyone).

// A compact, faux-3D SVG medallion for the splash header: layered gradient rings
// (outer one slowly spinning), a shaded disc with a trophy, and orbiting sparkles.
function SplashMedallion() {
    const id = useId().replace(/:/g, "");
    return (
        <div className="relative mx-auto h-28 w-28">
            {[0, 1, 2, 3].map((i) => (
                <motion.span
                    key={i}
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                    style={{ background: i % 2 ? "#fde68a" : "#ffffff" }}
                    animate={{
                        x: [0, Math.cos((i / 4) * Math.PI * 2) * 62, 0],
                        y: [0, Math.sin((i / 4) * Math.PI * 2) * 62, 0],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.15, 0.5],
                    }}
                    transition={{ duration: 3.5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                />
            ))}
            <motion.svg
                viewBox="0 0 200 200"
                className="h-full w-full drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 13, delay: 0.1 }}
            >
                <defs>
                    <radialGradient id={`sd-${id}`} cx="38%" cy="34%" r="72%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="55%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                    </radialGradient>
                </defs>
                {/* rotating dashed halo */}
                <motion.circle
                    cx="100" cy="100" r="92" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="3"
                    strokeDasharray="3 13" strokeLinecap="round"
                    style={{ transformOrigin: "100px 100px" }}
                    animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle
                    cx="100" cy="100" r="80" fill="none" stroke="#fde68a" strokeWidth="5"
                    strokeDasharray="130 400" strokeLinecap="round"
                    style={{ transformOrigin: "100px 100px" }}
                    animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
                {/* shaded gold disc */}
                <circle cx="100" cy="100" r="64" fill={`url(#sd-${id})`} />
                <ellipse cx="82" cy="78" rx="32" ry="18" fill="#ffffff" opacity="0.25" />
                {/* trophy glyph */}
                <g transform="translate(100 102)" fill="none" stroke="#7c2d12" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M-18 -26 h36 v10 a18 18 0 0 1 -36 0 z" fill="#fff7ed" stroke="#7c2d12" />
                    <path d="M-18 -22 h-8 a8 8 0 0 0 8 12" />
                    <path d="M18 -22 h8 a8 8 0 0 1 -8 12" />
                    <path d="M0 -4 v14" />
                    <path d="M-11 22 h22" />
                    <path d="M-6 10 h12 v12 h-12 z" fill="#fdba74" />
                </g>
            </motion.svg>
        </div>
    );
}

export default function ScholarshipSplash() {
    const [open, setOpen] = useState(false);
    const rid = useId().replace(/:/g, "");
    const { count } = useScholarshipCount();

    // Show shortly after the home screen paints (grabs attention without a jarring
    // flash before first paint). Fresh state on every mount → re-shows on return.
    useEffect(() => {
        if (Date.now() > SCHOLARSHIP_HIDE_AFTER) return;
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

    const detail = [
        { icon: CalendarDays, text: SCHOLARSHIP_TEST_DATE },
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

                        {/* Offer scene — inline sRGB gradient + animated SVG rays and a
                            floating 3D medallion (depth, not a flat colour block). */}
                        <div
                            className="relative overflow-hidden px-6 pb-7 pt-8 text-center text-white"
                            style={{ backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)" }}
                        >
                            {/* rotating conic rays behind the medallion */}
                            <motion.svg
                                aria-hidden viewBox="0 0 400 400"
                                className="pointer-events-none absolute left-1/2 top-2 h-64 w-64 -translate-x-1/2 opacity-25"
                                animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            >
                                <defs>
                                    <radialGradient id={`ray-${rid}`} cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                    </radialGradient>
                                </defs>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <path key={i} d="M200 200 L188 0 L212 0 Z" fill={`url(#ray-${rid})`} transform={`rotate(${i * 30} 200 200)`} />
                                ))}
                            </motion.svg>
                            <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />

                            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur">
                                <Trophy className="h-3.5 w-3.5" /> All-India Scholarship Test
                            </span>

                            <div className="relative mt-3">
                                <SplashMedallion />
                            </div>

                            <h2 className="relative mt-3 text-[32px] font-extrabold leading-none tracking-tight sm:text-[38px]">
                                Up to <span className="rounded-lg bg-amber-300 px-2 py-0.5 text-slate-900">100% OFF</span>
                            </h2>
                            <p className="relative mx-auto mt-3 max-w-xs text-[15px] font-medium leading-snug text-white/95">
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

                            {count > 0 && (
                                <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                                    <span className="relative flex h-2 w-2 shrink-0">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="tabular-nums"><b>{count.toLocaleString("en-IN")}</b> already registered — your turn!</span>
                                </p>
                            )}

                            <Link
                                to="/scholarship"
                                onClick={() => {
                                    track("scholarship_splash_cta");
                                    setOpen(false);
                                }}
                                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:scale-[1.02] active:scale-[0.98]"
                                style={{ backgroundImage: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
                            >
                                Register free now
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
