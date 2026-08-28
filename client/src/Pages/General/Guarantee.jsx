import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ShieldCheck, Check, ArrowRight, GraduationCap, FileCheck2, Wallet,
    Trophy, ScrollText, BadgeCheck,
} from "lucide-react";
import { SUCCESS_PROMISE_TABLE, ELIGIBILITY_CONDITIONS, CLAIM_PROCESS, LEGAL_ENTITY } from "@/data/legal";
import { useSeo } from "@/lib/useSeo";

// ── 3D-style inline SVG art (static, crisp at any size) ──────────────────────

// A beveled 3D shield with a gold tick — the hero centrepiece.
function Shield3D({ className = "" }) {
    const shield = "M100 16 L170 44 V106 Q170 168 100 200 Q30 168 30 106 V44 Z";
    return (
        <svg viewBox="0 0 210 224" className={className} role="img" aria-label="Guarantee shield">
            <defs>
                <linearGradient id="gr-face" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="55%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <linearGradient id="gr-edge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3730a3" />
                    <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
            </defs>
            {/* soft ground shadow */}
            <ellipse cx="103" cy="210" rx="56" ry="11" fill="#312e81" opacity="0.16" />
            {/* extruded edge for 3D thickness */}
            <path d={shield} transform="translate(7,7)" fill="url(#gr-edge)" />
            {/* front face */}
            <path d={shield} fill="url(#gr-face)" />
            {/* glossy top highlight */}
            <path d="M100 16 L170 44 V74 Q135 58 100 58 Q65 58 30 74 V44 Z" fill="#ffffff" opacity="0.14" />
            {/* gold tick */}
            <path d="M72 106 l20 22 42 -50" fill="none" stroke="#fbbf24" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// One isometric 3D block (top + two shaded sides) with an icon on its face.
function IsoBlock({ hue = "indigo" }) {
    const c = {
        indigo: ["#a5b4fc", "#6366f1", "#4338ca"],
        violet: ["#c4b5fd", "#8b5cf6", "#6d28d9"],
        amber: ["#fcd34d", "#f59e0b", "#b45309"],
    }[hue];
    return (
        <svg viewBox="0 0 120 120" className="h-16 w-16" aria-hidden="true">
            {/* top face */}
            <path d="M60 18 L104 43 L60 68 L16 43 Z" fill={c[0]} />
            {/* left face */}
            <path d="M16 43 L60 68 L60 104 L16 79 Z" fill={c[1]} />
            {/* right face */}
            <path d="M104 43 L60 68 L60 104 L104 79 Z" fill={c[2]} />
        </svg>
    );
}

const rupeeSteps = [
    { icon: GraduationCap, iso: "indigo", title: "1. Do the prep", body: "Enroll in your batch and follow the plan: the mocks, the PYQs and your mentor's guidance. We hold up our side by giving you everything you need." },
    { icon: FileCheck2, iso: "violet", title: "2. Sit the exam & counselling", body: "Appear for your LEET, then go through counselling exactly as your OneLeet mentor guides you. Do your part, honestly and fully." },
    { icon: Wallet, iso: "amber", title: "3. Didn't hit the result? Refund.", body: "If you completed the conditions and still didn't get the promised rank or admission, your fee comes back to you, per the terms below." },
];

export default function Guarantee() {
    useSeo({
        title: "The OneLeet Guarantee: Clear Your Target or Get a Refund",
        description:
            "OneLeet's money-back Success Promise: complete the prep and, if you don't secure the promised LEET rank or admission, your course fee is refunded. See exactly what we commit to, per exam.",
        path: "/guarantee",
    });

    // Show the top eligibility conditions in plain language; full list is linked.
    const keyConditions = ELIGIBILITY_CONDITIONS.slice(0, 5);

    return (
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-24 sm:pt-28">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 p-6 text-white sm:p-9">
                <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 -z-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="grid items-center gap-6 sm:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            <ShieldCheck size={13} /> The OneLeet Guarantee
                        </span>
                        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                            Clear your target, or get your{" "}
                            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">money back</span>.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100">
                            Do the prep. Sit the exam. If you complete your side and still don&apos;t get the rank or
                            admission we promised for your exam, your course fee is refunded. Simple, and in writing.
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300">
                                See the plans <ArrowRight size={16} />
                            </Link>
                            <Link to="/success-promise" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-indigo-50 backdrop-blur transition hover:bg-white/10">
                                <ScrollText size={16} /> Read the full terms
                            </Link>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
                        className="mx-auto h-44 w-44 sm:h-56 sm:w-56">
                        <Shield3D className="h-full w-full drop-shadow-2xl" />
                    </motion.div>
                </div>
            </div>

            {/* ── The deal in one line ─────────────────────────────── */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                    { icon: Trophy, t: "Performance-linked", d: "A refund tied to a real result, not a vague promise." },
                    { icon: BadgeCheck, t: "In writing", d: "Exact commitments per exam, agreed before you pay." },
                    { icon: Wallet, t: "Money back", d: "Meet the conditions, miss the result, get your fee back." },
                ].map((x, i) => (
                    <motion.div key={x.t}
                        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><x.icon size={17} /></span>
                        <p className="mt-2.5 text-sm font-bold text-slate-900 dark:text-slate-100">{x.t}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{x.d}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── How it works (3D iso steps) ──────────────────────── */}
            <h2 className="mt-14 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">How the guarantee works</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {rupeeSteps.map((s, i) => (
                    <motion.div key={s.title}
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                        <IsoBlock hue={s.iso} />
                        <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">{s.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── What we promise, per exam ────────────────────────── */}
            <h2 className="mt-14 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">What we promise, exam by exam</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                Every exam has its own clear target and refund. This is a performance-linked reward, not an
                unconditional guarantee of admission.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {SUCCESS_PROMISE_TABLE.map((r, i) => (
                    <motion.div key={r.exam}
                        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: (i % 2) * 0.06 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white"><Trophy size={15} /></span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.exam}</h3>
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">We commit to</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.commitment}</p>
                        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <Wallet size={15} className="mt-0.5 shrink-0" /> {r.reward}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ── Your side: eligibility ───────────────────────────── */}
            <div className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/40 sm:p-8">
                <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Your side of the deal</h2>
                <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                    The promise holds when you genuinely do the work. The main conditions:
                </p>
                <ul className="mx-auto mt-5 grid max-w-2xl gap-2.5 sm:grid-cols-1">
                    {keyConditions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {c}
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-center text-xs text-slate-400">
                    These are the headline conditions.{" "}
                    <Link to="/success-promise#eligibility" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">See the full list &amp; void conditions →</Link>
                </p>
            </div>

            {/* ── How to claim ─────────────────────────────────────── */}
            <h2 className="mt-14 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">How to claim your refund</h2>
            <div className="mx-auto mt-6 max-w-2xl space-y-3">
                {CLAIM_PROCESS.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{c}</p>
                    </div>
                ))}
            </div>

            {/* ── Close ────────────────────────────────────────────── */}
            <div className="mt-12 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 text-center dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-violet-500/10">
                <Shield3D className="mx-auto h-20 w-20" />
                <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">We only win when you do.</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                    That&apos;s why the guarantee exists. Pick your batch, do the work, and let the result take care of itself.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                        See the plans <ArrowRight size={16} />
                    </Link>
                    <Link to="/success-promise" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                        <ScrollText size={16} /> Full Success Promise &amp; Terms
                    </Link>
                </div>
                <p className="mt-5 text-[11px] text-slate-400">{LEGAL_ENTITY} · Full terms, eligibility and void conditions apply.</p>
            </div>
        </div>
    );
}
