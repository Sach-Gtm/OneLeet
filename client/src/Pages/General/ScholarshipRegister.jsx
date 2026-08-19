import { useId } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Monitor, BadgeCheck, Trophy, Medal, GraduationCap, IndianRupee } from "lucide-react";
import ScholarshipRegisterCard from "@/Components/General/ScholarshipRegisterCard";
import { SCHOLARSHIP_TEST_DATE } from "@/config/launch";
import { useSeo } from "@/lib/useSeo";

const CHIPS = [
    { icon: CalendarDays, text: SCHOLARSHIP_TEST_DATE },
    { icon: Monitor, text: "Online mode" },
    { icon: BadgeCheck, text: "Free registration" },
];

const STEPS = [
    { icon: GraduationCap, title: "Register free", body: "Fill the form below — it takes 30 seconds and creates your free OneLeet account." },
    { icon: Medal, title: "Take one common exam", body: `Sit the All-India test on ${SCHOLARSHIP_TEST_DATE}, online, from home. One paper, one national rank.` },
    { icon: IndianRupee, title: "Win up to 100% off", body: "The higher your rank, the bigger your scholarship — a ₹25,000 LEET course for ₹499, or fully free." },
];

// A layered, faux-3D SVG medallion: concentric gradient rings (the outer one
// slowly rotating), a shaded inner disc with a trophy, and orbiting sparkles.
// Pure SVG + transforms, so it stays crisp and cheap on phones.
function HeroBadge() {
    const id = useId().replace(/:/g, "");
    return (
        <div className="relative mx-auto h-52 w-52 sm:h-60 sm:w-60">
            {/* orbiting sparkles */}
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                    key={i}
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
                    style={{ background: i % 2 ? "#fbbf24" : "#a855f7" }}
                    animate={{
                        x: [0, Math.cos((i / 5) * Math.PI * 2) * 118, 0],
                        y: [0, Math.sin((i / 5) * Math.PI * 2) * 118, 0],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1.2, 0.6],
                    }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                />
            ))}

            <motion.svg
                viewBox="0 0 200 200"
                className="h-full w-full drop-shadow-[0_20px_40px_rgba(124,58,237,0.35)]"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
            >
                <defs>
                    <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="55%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <radialGradient id={`disc-${id}`} cx="38%" cy="34%" r="72%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="55%" stopColor="#6d28d9" />
                        <stop offset="100%" stopColor="#4c1d95" />
                    </radialGradient>
                </defs>

                {/* rotating dashed outer ring */}
                <motion.circle
                    cx="100" cy="100" r="92" fill="none" stroke={`url(#ring-${id})`} strokeWidth="3"
                    strokeDasharray="4 12" strokeLinecap="round" opacity="0.7"
                    style={{ transformOrigin: "100px 100px" }}
                    animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
                />
                {/* rotating gradient arc (other direction) */}
                <motion.circle
                    cx="100" cy="100" r="80" fill="none" stroke={`url(#ring-${id})`} strokeWidth="6"
                    strokeDasharray="150 400" strokeLinecap="round"
                    style={{ transformOrigin: "100px 100px" }}
                    animate={{ rotate: -360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                />

                {/* shaded 3D disc */}
                <circle cx="100" cy="100" r="66" fill={`url(#disc-${id})`} />
                {/* top highlight to fake a sphere */}
                <ellipse cx="82" cy="76" rx="34" ry="20" fill="#ffffff" opacity="0.18" />

                {/* trophy glyph */}
                <g transform="translate(100 100)" fill="none" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M-18 -26 h36 v10 a18 18 0 0 1 -36 0 z" fill="#fbbf24" stroke="#fde68a" />
                    <path d="M-18 -22 h-8 a8 8 0 0 0 8 12" />
                    <path d="M18 -22 h8 a8 8 0 0 1 -8 12" />
                    <path d="M0 -4 v14" />
                    <path d="M-11 22 h22" />
                    <path d="M-6 10 h12 v12 h-12 z" fill="#f59e0b" />
                </g>
            </motion.svg>

            {/* floating "100%" tag */}
            <motion.span
                className="absolute -right-1 top-6 rounded-xl px-2.5 py-1 text-sm font-extrabold text-slate-900 shadow-lg"
                style={{ background: "#fcd34d" }}
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, y: [0, -6, 0] }}
                transition={{ scale: { delay: 0.5, type: "spring" }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
            >
                100% OFF
            </motion.span>
        </div>
    );
}

export default function ScholarshipRegister() {
    useSeo({
        title: "All-India LEET Scholarship Test — Register Free | OneLeet",
        description: `Register free for OneLeet's All-India Scholarship Test on ${SCHOLARSHIP_TEST_DATE}. One common online exam, one national rank — win up to a 100% scholarship on your LEET course.`,
        path: "/scholarship",
    });

    return (
        <div className="relative mx-auto max-w-3xl overflow-hidden px-4 pb-24 pt-24 sm:pt-28">
            {/* soft floating orbs for depth */}
            <motion.span aria-hidden className="pointer-events-none absolute -top-6 left-[6%] -z-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl"
                animate={{ y: [0, 26, 0], x: [0, 16, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
            <motion.span aria-hidden className="pointer-events-none absolute top-8 right-[4%] -z-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl"
                animate={{ y: [0, -22, 0], x: [0, -14, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />

            {/* Hero */}
            <div className="text-center">
                <motion.span
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Trophy size={13} /> All-India Scholarship Test
                </motion.span>

                <div className="mt-6">
                    <HeroBadge />
                </div>

                <motion.h1
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Win up to a <span className="rounded-lg bg-amber-300 px-2 text-slate-900">100%</span> LEET scholarship
                </motion.h1>
                <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                    One common online exam. One all-India rank. The higher you rank, the bigger your
                    scholarship — a ₹25,000 LEET course for just ₹499, or completely free.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {CHIPS.map((c) => {
                        const Icon = c.icon;
                        return (
                            <span key={c.text} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <Icon className="h-3.5 w-3.5 text-indigo-500" /> {c.text}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* How it works */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.title}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <Icon size={17} />
                            </span>
                            <h3 className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <span className="text-indigo-400">{i + 1}.</span> {s.title}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Registration */}
            <motion.div
                id="register"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-8"
            >
                <ScholarshipRegisterCard source="scholarship-page" />
            </motion.div>
        </div>
    );
}
