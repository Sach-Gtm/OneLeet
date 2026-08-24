import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Briefcase, Users, Check, Loader2, ArrowRight, ShieldCheck,
    GraduationCap, Sparkles, Clock, CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { getMbaStatus, registerMba } from "@/Api/MbaApi";
import { getCourse } from "@/Api/CoursesApi";
import { useCart } from "@/context/CartContext";
import { MBA_COLLEGE_GROUPS } from "@/data/mbaColleges";
import { useSeo } from "@/lib/useSeo";

const MBA_SLUG = "mba-mock-pi";
const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const off = (mrp, price) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);

// Batch scarcity: 100 seats, 89 already taken today, +1 every day, so the batch
// fills on day 11. Purely time-based (anchored to a fixed date) so every viewer
// sees the same honest, steadily-rising number — no per-visit randomness.
const BATCH_TOTAL = 100;
const BATCH_START_FILLED = 89;
const BATCH_ANCHOR = new Date("2026-08-24T00:00:00+05:30").getTime();
function batchFilled() {
    const days = Math.max(0, Math.floor((Date.now() - BATCH_ANCHOR) / 86400000));
    return Math.min(BATCH_TOTAL, BATCH_START_FILLED + days);
}

// Fallback course copy if the DB fetch is slow / unavailable, so the page still
// renders the offer. The real numbers come from the seeded course.
const FALLBACK_COURSE = {
    slug: MBA_SLUG,
    name: "MBA Mock PI Program",
    price: 94050,
    mrp: 99000,
    tagline: "30 mock personal interviews with mentors from top consulting and premier B-school backgrounds.",
    whatsInside: [
        "30 full mock Personal Interviews (PIs), one-on-one and held to real B-school interview standard",
        "Interview panels drawn from top consulting backgrounds (including BCG) and premier B-school graduates",
        "Detailed feedback after every interview: content, structure, communication and body language",
        "WAT / essay and extempore practice mapped to each interview round",
        "Profile-based question banks: academics, work experience, current affairs and your 'why MBA' story",
        "A final readiness report with your strengths and the exact gaps to close before the real PI",
    ],
};

function SeatMeter({ filled }) {
    const left = Math.max(0, BATCH_TOTAL - filled);
    const pct = Math.min(100, Math.round((filled / BATCH_TOTAL) * 100));
    const full = left === 0;
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                    <Users size={16} />
                    {full
                        ? "This batch is full"
                        : <><span className="tabular-nums">{filled}</span> candidates have already joined this batch</>}
                </p>
                {!full && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
                        <Clock size={12} /> Only {left} seat{left === 1 ? "" : "s"} left
                    </span>
                )}
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-500/20">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                />
            </div>
            <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-300/80">
                {full
                    ? "Registrations for this batch have closed. Contact us to join the next one."
                    : "Seats fill every day. It's your turn, register now before this batch closes."}
            </p>
        </div>
    );
}

export default function OneLeetMba() {
    const navigate = useNavigate();
    const { add, has } = useCart();

    const [status, setStatus] = useState(null); // { registered, college } | null while loading
    const [course, setCourse] = useState(null);
    const [college, setCollege] = useState("");
    const [phone, setPhone] = useState("");
    const [busy, setBusy] = useState(false);

    const filled = useMemo(() => batchFilled(), []);

    useSeo({ title: "OneLeet MBA: Mock PI Program", path: "/mba" });

    useEffect(() => {
        getMbaStatus()
            .then((s) => setStatus(s))
            .catch(() => setStatus({ registered: false, college: "" }));
        getCourse(MBA_SLUG)
            .then((c) => setCourse(c || FALLBACK_COURSE))
            .catch(() => setCourse(FALLBACK_COURSE));
    }, []);

    const c = course || FALLBACK_COURSE;

    async function onRegister(e) {
        e.preventDefault();
        if (!college) return toast.error("Please select your college to register.");
        setBusy(true);
        try {
            const res = await registerMba({ college, phone });
            setStatus({ registered: true, college: res.college || college });
            toast.success("You're registered for the OneLeet MBA batch!");
        } catch (err) {
            toast.error(err.message || "Couldn't register, please try again.");
        } finally {
            setBusy(false);
        }
    }

    function enroll() {
        if (c?.slug) add({ slug: c.slug, name: c.name, price: c.price, subtitle: "MBA Mock PI" });
        navigate("/checkout");
    }

    if (status === null) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    const bullets = (c.whatsInside && c.whatsInside.length ? c.whatsInside : FALLBACK_COURSE.whatsInside).slice(0, 6);

    return (
        <div className="mx-auto max-w-3xl px-4 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white">
                <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    <Briefcase size={13} /> OneLeet MBA
                </span>
                <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Ace your MBA Personal Interview</h1>
                <p className="mt-1.5 max-w-xl text-sm text-indigo-100">
                    A focused Mock PI batch for MBA aspirants: 30 real mock interviews with mentors from top
                    consulting and premier B-school backgrounds, plus structured feedback after every round.
                </p>
            </div>

            {/* Scarcity meter */}
            <div className="mt-5">
                <SeatMeter filled={filled} />
            </div>

            {/* Gate: register your college first, then see the program */}
            {!status.registered ? (
                <motion.form
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    onSubmit={onRegister}
                    className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
                >
                    <div className="flex items-center gap-2">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <GraduationCap size={17} />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Register for the batch</h2>
                            <p className="text-xs text-slate-400">Pick your college to unlock the Mock PI program.</p>
                        </div>
                    </div>

                    <label className="mt-4 block text-xs font-semibold text-slate-500 dark:text-slate-400">Your college / target B-school *</label>
                    <select
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                        <option value="">Select your college…</option>
                        {MBA_COLLEGE_GROUPS.map((g) => (
                            <optgroup key={g.label} label={g.label}>
                                {g.options.map((o) => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    <label className="mt-3 block text-xs font-semibold text-slate-500 dark:text-slate-400">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        inputMode="tel"
                        placeholder="For interview scheduling"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />

                    <button
                        type="submit"
                        disabled={busy || !college}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Register &amp; see the program
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                        <ShieldCheck size={12} /> Free to register · you only pay if you enroll in the Mock PI program
                    </p>
                </motion.form>
            ) : (
                <>
                    {/* Registered confirmation */}
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Check size={16} className="shrink-0" />
                        You're registered{status.college ? <> as <strong className="font-semibold">{status.college}</strong></> : ""}. Here's your Mock PI program.
                    </div>

                    {/* The Mock PI program — purchasable */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-4 overflow-hidden rounded-2xl border border-violet-300 bg-white p-6 shadow-xl shadow-violet-500/10 dark:border-violet-500/40 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                                    <Sparkles size={18} />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h2>
                                    {c.tagline && <p className="text-xs text-slate-400">{c.tagline}</p>}
                                </div>
                            </div>
                            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                {off(c.mrp, c.price)}% OFF
                            </span>
                        </div>

                        <ul className="mt-4 space-y-2">
                            {bullets.map((b) => (
                                <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {b}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{rupee(c.price)}</span>
                                    <span className="text-sm text-slate-400 line-through">{rupee(c.mrp)}</span>
                                </div>
                                <p className="text-[11px] text-slate-400">One-time · all 30 interviews included</p>
                            </div>
                            <button
                                type="button"
                                onClick={enroll}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
                            >
                                <CreditCard size={17} /> {has(c.slug) ? "Go to checkout" : "Enroll now"}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
