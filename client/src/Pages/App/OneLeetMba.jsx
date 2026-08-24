import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Briefcase, Check, ArrowRight, CreditCard, Sparkles,
    Target, Users, Award, MessageSquare, FileText, TrendingUp,
} from "lucide-react";
import { getCourse } from "@/Api/CoursesApi";
import { useCart } from "@/context/CartContext";
import { useSeo } from "@/lib/useSeo";

const MBA_SLUG = "mba-mock-pi";
const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const off = (mrp, price) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);

// Copy shown instantly while the seeded course loads (real numbers come from DB).
const FALLBACK_COURSE = {
    slug: MBA_SLUG,
    name: "MBA Placement Bootcamp",
    price: 94050,
    mrp: 99000,
    tagline: "A placement bootcamp for final-year MBA students: 30 mock interviews to walk into placement season ready to convert.",
    whatsInside: [
        "30 full mock placement interviews (HR, personal, case & guesstimate rounds), one-on-one and held to real recruiter standard",
        "Interview panels drawn from top consulting backgrounds (including BCG) and premier B-school graduates",
        "Detailed feedback after every round: structure, communication, presence and how you'd land with a real panel",
        "Group Discussion (GD), WAT and extempore practice for the shortlisting rounds",
        "Resume polish and a tight 'walk me through your profile', with company- and role-specific question banks",
        "A final readiness report: your strengths and the exact gaps to close before placement season",
    ],
};

// Aspirational hero art: a skyline of company towers rising to a gold "top"
// tower, with a climbing path and a star at the summit. Pure inline SVG so it
// stays crisp and theme-independent; framer-motion gives it the "rising" feel.
function SkylineClimb() {
    const towers = [
        { x: 8, w: 30, h: 58 },
        { x: 44, w: 30, h: 92 },
        { x: 80, w: 34, h: 132 }, // the summit (gold)
        { x: 120, w: 30, h: 104 },
        { x: 156, w: 30, h: 72 },
        { x: 192, w: 30, h: 50 },
    ];
    const BASE = 176;
    return (
        <svg viewBox="0 0 232 190" className="h-full w-full" role="img" aria-label="Rising city skyline with a summit">
            <defs>
                <linearGradient id="mbaTower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7d2fe" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="mbaSummit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>

            {/* ground line */}
            <line x1="0" y1={BASE + 1} x2="232" y2={BASE + 1} stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />

            {towers.map((t, i) => {
                const summit = i === 2;
                return (
                    <g key={i}>
                        <motion.rect
                            x={t.x}
                            width={t.w}
                            rx="4"
                            fill={summit ? "url(#mbaSummit)" : "url(#mbaTower)"}
                            opacity={summit ? 1 : 0.9}
                            initial={{ height: 0, y: BASE }}
                            animate={{ height: t.h, y: BASE - t.h }}
                            transition={{ duration: 0.7, delay: 0.1 + i * 0.09, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        {/* window dots */}
                        {Array.from({ length: Math.max(2, Math.floor(t.h / 26)) }).map((_, r) => (
                            <motion.rect
                                key={r}
                                x={t.x + t.w / 2 - 3}
                                y={BASE - t.h + 12 + r * 22}
                                width="6"
                                height="6"
                                rx="1.5"
                                fill="#fff"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.85, 0.5, 0.85] }}
                                transition={{ duration: 3, delay: 0.8 + i * 0.1 + r * 0.15, repeat: Infinity, repeatType: "reverse" }}
                            />
                        ))}
                    </g>
                );
            })}

            {/* climbing path up to the summit */}
            <motion.path
                d="M12 168 L52 150 L96 118 L96 60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="6 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.9, ease: "easeInOut" }}
            />
            {/* star at the summit */}
            <motion.path
                d="M97 40 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1 z"
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth="1"
                initial={{ scale: 0, opacity: 0, transformOrigin: "97px 52px" }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.9 }}
            />
        </svg>
    );
}

export default function OneLeetMba() {
    const navigate = useNavigate();
    const { add, has } = useCart();
    const [course, setCourse] = useState(null);

    useSeo({
        title: "MBA Placement Bootcamp | OneLeet",
        description:
            "A placement bootcamp for final-year MBA students: 30 mock interviews with panels from top consulting (including BCG) and premier B-schools, so you walk into placement season ready to land offers at top companies.",
        path: "/mba",
    });

    useEffect(() => {
        getCourse(MBA_SLUG)
            .then((c) => setCourse(c || FALLBACK_COURSE))
            .catch(() => setCourse(FALLBACK_COURSE));
    }, []);

    const c = course || FALLBACK_COURSE;
    const bullets = (c.whatsInside && c.whatsInside.length ? c.whatsInside : FALLBACK_COURSE.whatsInside).slice(0, 6);

    function enroll() {
        if (c?.slug) add({ slug: c.slug, name: c.name, price: c.price, subtitle: "MBA Placement Bootcamp" });
        navigate("/checkout");
    }

    const forYou = [
        { icon: Users, label: "Final-year MBA students", sub: "Heading into placement / final-placement season" },
        { icon: Target, label: "Aiming at top companies", sub: "Consulting, product, finance, general management" },
        { icon: TrendingUp, label: "Serious about converting", sub: "You want reps, not theory, before the real panel" },
    ];

    return (
        <div className="mx-auto max-w-4xl px-4 pb-24">
            {/* ── Hero ───────────────────────────────────────────────── */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-900 p-6 text-white sm:p-9">
                <motion.span aria-hidden className="pointer-events-none absolute -right-10 -top-12 -z-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"
                    animate={{ y: [0, 20, 0], x: [0, -12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
                <motion.span aria-hidden className="pointer-events-none absolute -bottom-16 left-[20%] -z-10 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl"
                    animate={{ y: [0, -18, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} />

                <div className="grid items-center gap-6 sm:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            <Briefcase size={13} /> MBA Placement Bootcamp
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                            className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                            It&apos;s time to step into <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">top companies</span>.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
                            className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100">
                            Final year is placement year. This bootcamp puts you through <strong className="font-semibold text-white">30 mock interviews</strong> with
                            panels from top consulting (including BCG) and premier B-schools, so you walk into every round sharp, composed and ready to land the offer.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
                            className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={enroll}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300">
                                <CreditCard size={17} /> {has(c.slug) ? "Go to checkout" : "Enroll now"} <ArrowRight size={16} />
                            </button>
                            <div className="text-sm">
                                <span className="text-xl font-extrabold">{rupee(c.price)}</span>
                                <span className="ml-2 text-indigo-200 line-through">{rupee(c.mrp)}</span>
                                <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-200">{off(c.mrp, c.price)}% OFF</span>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto h-44 w-full max-w-xs text-indigo-200 sm:h-52">
                        <SkylineClimb />
                    </motion.div>
                </div>
            </div>

            {/* ── Who it's for ───────────────────────────────────────── */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {forYou.map((f, i) => (
                    <motion.div
                        key={f.label}
                        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <f.icon size={17} />
                        </span>
                        <p className="mt-2.5 text-sm font-bold text-slate-900 dark:text-slate-100">{f.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{f.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── The bootcamp — what's inside + enroll ──────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4 }}
                className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-xl shadow-violet-500/10 dark:border-violet-500/40 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white">
                            <Sparkles size={18} />
                        </span>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h2>
                            {c.tagline && <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">{c.tagline}</p>}
                        </div>
                    </div>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {off(c.mrp, c.price)}% OFF
                    </span>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-[1.4fr_1fr]">
                    <ul className="space-y-2.5">
                        {bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {b}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:from-indigo-500/10 dark:to-violet-500/10">
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><MessageSquare size={15} className="text-violet-500" /> 30 one-on-one mock interviews</p>
                            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><Award size={15} className="text-violet-500" /> Panels from BCG &amp; top B-schools</p>
                            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><FileText size={15} className="text-violet-500" /> Feedback + a final readiness report</p>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{rupee(c.price)}</span>
                                <span className="text-sm text-slate-400 line-through">{rupee(c.mrp)}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">One-time · all 30 interviews included</p>
                            <button
                                type="button"
                                onClick={enroll}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700">
                                <CreditCard size={17} /> {has(c.slug) ? "Go to checkout" : "Enroll now"} <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Closing line ───────────────────────────────────────── */}
            <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                className="mt-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                Your offer letter starts with one great interview. Get 30 reps in first.
            </motion.p>
        </div>
    );
}
