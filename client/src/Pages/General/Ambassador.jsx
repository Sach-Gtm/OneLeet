import { useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    Megaphone, IndianRupee, FileText, Award, Gift, Zap, Check, Loader2,
    ArrowRight, Clock, Users, Sparkles, TrendingUp, Briefcase, Send, Instagram, Youtube,
} from "lucide-react";
import { applyAmbassador } from "@/Api/AmbassadorApi";
import { useSeo } from "@/lib/useSeo";

// ── 3D-style inline SVG art (static) ─────────────────────────────────────────

// A stack of gold 3D coins with a ₹ on top — the earnings hook.
function Coins3D({ className = "" }) {
    const coin = (y, key) => (
        <g key={key}>
            <ellipse cx="70" cy={y + 15} rx="46" ry="15" fill="#b45309" />
            <rect x="24" y={y} width="92" height="15" fill="#d97706" />
            <ellipse cx="70" cy={y} rx="46" ry="15" fill="#f59e0b" />
            <ellipse cx="70" cy={y} rx="46" ry="15" fill="none" stroke="#fbbf24" strokeWidth="2" />
        </g>
    );
    return (
        <svg viewBox="0 0 150 150" className={className} role="img" aria-label="Stack of coins">
            <ellipse cx="70" cy="132" rx="52" ry="11" fill="#78350f" opacity="0.18" />
            {coin(96, "a")}
            {coin(72, "b")}
            {coin(48, "c")}
            {/* top coin face with ₹ */}
            <ellipse cx="70" cy="30" rx="46" ry="15" fill="#fcd34d" />
            <ellipse cx="70" cy="30" rx="46" ry="15" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <text x="70" y="37" textAnchor="middle" fontSize="20" fontWeight="800" fill="#92400e">₹</text>
        </svg>
    );
}

// One isometric 3D block (top + two shaded sides).
function IsoBlock({ hue = "indigo", className = "h-12 w-12" }) {
    const c = {
        indigo: ["#a5b4fc", "#6366f1", "#4338ca"],
        amber: ["#fcd34d", "#f59e0b", "#b45309"],
        emerald: ["#6ee7b7", "#10b981", "#047857"],
        violet: ["#c4b5fd", "#8b5cf6", "#6d28d9"],
    }[hue];
    return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
            <path d="M60 18 L104 43 L60 68 L16 43 Z" fill={c[0]} />
            <path d="M16 43 L60 68 L60 104 L16 79 Z" fill={c[1]} />
            <path d="M104 43 L60 68 L60 104 L104 79 Z" fill={c[2]} />
        </svg>
    );
}

const BENEFITS = [
    { icon: IndianRupee, tint: "from-amber-400 to-orange-500", title: "Earn up to ₹5,000 / month", sub: "Performance & sales based. No cap on top performers." },
    { icon: FileText, tint: "from-indigo-500 to-indigo-700", title: "Letter of Recommendation", sub: "Signed by IIT KGP + IIM Rohtak alumni. Add it to your CV." },
    { icon: Award, tint: "from-violet-500 to-fuchsia-600", title: "Completion Certificate", sub: "Verified. Put it on your resume & LinkedIn." },
    { icon: Gift, tint: "from-emerald-500 to-teal-600", title: "Exclusive Goodies", sub: "Top performers get the OneLeet merch pack." },
    { icon: Zap, tint: "from-sky-500 to-blue-600", title: "FREE Premium Subscription", sub: "Full access to the entire OneLeet platform." },
    { icon: Users, tint: "from-rose-500 to-pink-600", title: "Mentor Network", sub: "Work directly with the founding team and mentors." },
];

const EXPOSURE = [
    { hue: "indigo", title: "Real work, real resume", body: "Actual marketing, outreach and sales experience you can show, not just a title on paper." },
    { hue: "amber", title: "Credibility that opens doors", body: "An LoR from top-institute alumni plus a verified certificate that recruiters and colleges recognise." },
    { hue: "emerald", title: "A network that lasts", body: "Direct access to founders, mentors and a community of ambitious students across Delhi." },
];

const ELIGIBILITY = ["Delhi diploma college student", "Active on social media", "Basic communication skills", "2 to 3 hours / week"];

export default function Ambassador() {
    const formRef = useRef(null);
    const [form, setForm] = useState({
        name: "", phone: "", email: "", college: "",
        year: "", socialHandle: "", socialReach: "", whyJoin: "", work: "",
    });
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    useSeo({
        title: "OneLeet Campus Ambassador Program: Apply (Delhi Diploma Colleges)",
        description:
            "Become a OneLeet Campus Ambassador: earn up to ₹5,000/month, a Letter of Recommendation signed by IIT KGP + IIM Rohtak alumni, a completion certificate, goodies and free premium access. Batch 2026, limited slots. Apply now.",
        path: "/ambassador",
    });

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    async function submit(e) {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.college.trim()) {
            return toast.error("Please fill your name, phone, email and college.");
        }
        setBusy(true);
        try {
            const res = await applyAmbassador(form);
            setDone(true);
            toast.success(res?.message || "Application received!");
        } catch (err) {
            toast.error(err.message || "Couldn't submit, please try again.");
        } finally {
            setBusy(false);
        }
    }

    const field = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
    const area = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

    return (
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-24 sm:pt-28">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white sm:p-9">
                <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 -z-10 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="grid items-center gap-6 sm:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300 backdrop-blur-sm">
                            <Megaphone size={13} /> Campus Ambassador Program
                        </span>
                        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                            Delhi Diploma Colleges. <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">We want you in.</span>
                        </h1>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">Batch 2026 · Limited slots · Selection basis</p>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100">
                            Spread OneLeet in your college and guide diploma students on their LEET prep. Get paid,
                            build a real resume, and get exposure that actually counts.
                        </p>
                        <button type="button" onClick={scrollToForm}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300">
                            Apply now <ArrowRight size={16} />
                        </button>
                    </div>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
                        className="mx-auto h-40 w-40 sm:h-48 sm:w-48">
                        <Coins3D className="h-full w-full drop-shadow-2xl" />
                    </motion.div>
                </div>
            </div>

            {/* ── Earnings strip ───────────────────────────────────── */}
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30"><IndianRupee size={26} /></span>
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">Earn every month</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Up to ₹5,000</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Performance & sales based. No cap on top performers.</p>
                </div>
            </div>

            {/* ── Benefits ─────────────────────────────────────────── */}
            <h2 className="mt-12 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">What you get</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BENEFITS.map((b, i) => (
                    <motion.div key={b.title}
                        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                        <span className={"grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md " + b.tint}><b.icon size={20} /></span>
                        <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{b.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{b.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Real exposure ────────────────────────────────────── */}
            <div className="mt-12 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-violet-500/10 sm:p-8">
                <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white"><TrendingUp size={13} /> Real exposure, not just a title</span>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">This actually builds your career</h2>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {EXPOSURE.map((x) => (
                        <div key={x.title} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                            <IsoBlock hue={x.hue} />
                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{x.title}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{x.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── What you'll do + eligibility ─────────────────────── */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"><Briefcase size={17} className="text-indigo-500" /> Kya karna hai?</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> Spread OneLeet awareness in your college</li>
                        <li className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> Guide diploma students on LEET preparation</li>
                        <li className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> Share on your socials & help juniors get started</li>
                        <li className="flex items-start gap-2"><Clock size={15} className="mt-0.5 shrink-0 text-indigo-500" /> Just 2 to 3 hours a week, from now to Dec 2026</li>
                    </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"><Users size={17} className="text-indigo-500" /> Kaun apply kar sakta hai?</h3>
                    <ul className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                        {ELIGIBILITY.map((x) => (
                            <li key={x} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {x}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ── Application form ─────────────────────────────────── */}
            <div ref={formRef} className="mt-12 scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-500/5 dark:border-slate-700 dark:bg-slate-900">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                    <h2 className="text-xl font-bold">Apply to join the OneLeet team</h2>
                    <p className="text-sm text-indigo-100">Limited slots, selection basis. Fill this and we&apos;ll reach out.</p>
                </div>

                {done ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15"><Check size={30} /></div>
                        <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Application received! 🎉</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Thanks for applying to the OneLeet Campus Ambassador Program. We&apos;ll review your application
                            and reach out on your email / WhatsApp. Selection is on merit, so keep an eye out!
                        </p>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Full name *</label>
                                <input className={field + " mt-1"} value={form.name} onChange={set("name")} placeholder="Your name" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phone / WhatsApp *</label>
                                <input className={field + " mt-1"} value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="10-digit number" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email *</label>
                                <input className={field + " mt-1"} value={form.email} onChange={set("email")} inputMode="email" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">College *</label>
                                <input className={field + " mt-1"} value={form.college} onChange={set("college")} placeholder="Your diploma college" />
                            </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">A few more details <span className="font-normal">(optional, but they help you get selected)</span></p>
                            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Which year are you in?</label>
                                    <input className={field + " mt-1"} value={form.year} onChange={set("year")} placeholder="e.g. 2nd year diploma" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Social handle</label>
                                    <input className={field + " mt-1"} value={form.socialHandle} onChange={set("socialHandle")} placeholder="@instagram / LinkedIn URL" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approx followers / reach</label>
                                    <input className={field + " mt-1"} value={form.socialReach} onChange={set("socialReach")} placeholder="e.g. 1.2k on Instagram" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">What do you currently do?</label>
                                    <input className={field + " mt-1"} value={form.work} onChange={set("work")} placeholder="Studies / job / projects" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Why do you want to join? (Hindi ya English, dono chalega)</label>
                                <textarea className={area + " mt-1"} rows={3} value={form.whyJoin} onChange={set("whyJoin")} placeholder="Tell us in your own words…" />
                            </div>
                        </div>

                        <button type="submit" disabled={busy}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Submit application
                        </button>
                        <p className="text-center text-[11px] text-slate-400">Selection is on merit. We&apos;ll contact shortlisted applicants on email / WhatsApp.</p>
                    </form>
                )}
            </div>

            {/* ── Socials ──────────────────────────────────────────── */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <a href="https://t.me/oneleetofficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-indigo-600"><Send size={15} /> Telegram</a>
                <a href="https://www.instagram.com/oneleet.in/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-pink-500"><Instagram size={15} /> @oneleet.in</a>
                <a href="https://www.youtube.com/@oneleetofficial" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-red-500"><Youtube size={15} /> YouTube</a>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-400">
                <Sparkles size={13} className="text-amber-500" /> Guess mat karo. Test karo.
            </p>
        </div>
    );
}
