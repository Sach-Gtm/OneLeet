import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Sparkles, BookOpen, ClipboardList, FileText, BarChart3, Target, Compass, Users,
    Check, Crown, ArrowRight, ShieldCheck, Clock, Star, GraduationCap, Info, Plus,
} from "lucide-react";
import {
    EXAM_COURSES, COUNSELLING_COURSES, MEMBERSHIP_GROUPS, FREE_FEATURES,
    MEMBERSHIP_PROMISE, CART_TIERS,
} from "@/data/pricing";
import { useCart } from "@/context/CartContext";
import { getCourses } from "@/Api/CoursesApi";
import { useSeo } from "@/lib/useSeo";

const GROUP_ICON = {
    sparkles: Sparkles, book: BookOpen, clipboard: ClipboardList, files: FileText,
    chart: BarChart3, target: Target, compass: Compass, users: Users,
};

const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const off = (mrp, price) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);

function CourseCard({ c, featured }) {
    const { has, toggle } = useCart();
    const inCart = has(c.slug);
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35 }}
            whileHover={{ y: -6 }}
            className={
                "relative flex flex-col rounded-2xl border p-5 " +
                (featured
                    ? "border-indigo-300 bg-white shadow-xl shadow-indigo-500/10 dark:border-indigo-500/40 dark:bg-slate-900"
                    : "border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/60")
            }
        >
            {featured && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow">
                    <Star size={12} /> Most popular
                </span>
            )}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.subtitle}</p>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {off(c.mrp, c.price)}% OFF
                </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{rupee(c.price)}</span>
                <span className="text-sm text-slate-400 line-through">{rupee(c.mrp)}</span>
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                <Clock size={11} /> Early-bird launch price
            </p>

            {c.promise && (
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                    <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck size={12} /> Success Promise
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{c.promise}</p>
                </div>
            )}

            <button
                type="button"
                onClick={() => toggle({ slug: c.slug, name: c.name, price: c.price, subtitle: c.subtitle })}
                className={
                    "mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition " +
                    (inCart
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700")
                }
            >
                {inCart ? <><Check size={16} /> Added to cart</> : <><Plus size={16} /> Add to cart</>}
            </button>
            <Link to={`/courses/${c.slug}`} className="mt-2 text-center text-[11px] text-slate-400 hover:text-indigo-500 hover:underline">
                View what&apos;s inside →
            </Link>
        </motion.div>
    );
}

export default function Pricing() {
    // Fully dynamic: the exam batches come from the DB (published, admin-editable
    // in Admin → Batches), sorted by `order`. The static config is only a fallback
    // until the fetch lands, or if nothing is seeded yet.
    const [dbCourses, setDbCourses] = useState(null);
    useEffect(() => {
        getCourses().then((list) => setDbCourses(list || [])).catch(() => setDbCourses([]));
    }, []);
    const examCourses = useMemo(() => {
        const exam = (dbCourses || []).filter((c) => (c.kind || "exam") === "exam");
        if (!exam.length) return EXAM_COURSES;
        return exam
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((c, i) => ({
                slug: c.slug,
                name: c.name,
                subtitle: c.examName || "",
                price: c.price,
                mrp: c.mrp,
                promise: c.successPromise || "",
                featured: i === 0,
            }));
    }, [dbCourses]);

    useSeo({
        title: "LEET Courses & Mock Test Series — Pricing | OneLeet Premium",
        description: "OneLeet membership: exam-wise LEET batches, ranked mock tests, past papers, notes, AI practice and counselling support. See plans, discounts and the Success Promise.",
        path: "/pricing",
    });

    return (
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:pt-32">
            {/* Hero */}
            <div className="relative isolate text-center">
                {/* animated background accents */}
                <motion.span aria-hidden className="pointer-events-none absolute -top-10 left-[12%] -z-10 h-44 w-44 rounded-full bg-indigo-400/20 blur-3xl"
                    animate={{ y: [0, 24, 0], x: [0, 14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
                <motion.span aria-hidden className="pointer-events-none absolute -top-4 right-[12%] -z-10 h-36 w-36 rounded-full bg-violet-400/20 blur-3xl"
                    animate={{ y: [0, -20, 0], x: [0, -16, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
                <motion.span
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Crown size={13} /> OneLeet Premium Membership
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    You don&apos;t just buy a course. You join an ecosystem.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
                    className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    One membership for your exam — AI mentor, premium PYQs, mock series, rank & college
                    predictor, counselling support and a Success Promise. Built by someone who cleared LEET.
                </motion.p>
                <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
                    {MEMBERSHIP_PROMISE.map((p, i) => (
                        <motion.span key={p}
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            <Check size={12} className="text-emerald-500" /> {p}
                        </motion.span>
                    ))}
                </div>
            </div>

            {/* Multi-course discount tiers */}
            <div className="mt-10 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white">
                <p className="text-center text-sm font-semibold">
                    Preparing for more than one exam? Add batches to your cart and the discount stacks automatically:
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CART_TIERS.map((t, i) => (
                        <motion.div
                            key={t.count}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.08 }}
                            whileHover={{ y: -3, scale: 1.03 }}
                            className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm"
                        >
                            <p className="text-lg font-extrabold">{t.count === 5 ? "5+" : t.count} courses</p>
                            <p className="text-xs text-indigo-100">Extra {t.off}% OFF</p>
                        </motion.div>
                    ))}
                </div>
                <p className="mt-2 text-center text-[11px] text-indigo-200">Applies to your whole cart, on top of every early-bird price — up to ₹1,000 off.</p>
            </div>

            {/* Exam courses */}
            <h2 className="mt-12 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Choose your exam batch</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {examCourses.map((c) => (
                    <CourseCard key={c.slug} c={c} featured={c.featured} />
                ))}
            </div>

            {/* Counselling-only colleges */}
            <div className="mt-12">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Counselling &amp; interview prep</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                        These colleges admit through interview / counselling, not a written LEET — so this is a
                        focused counselling + interview-prep pack, <span className="font-semibold text-amber-600">launching soon</span>.
                        For exam batches above, counselling-only support is available at 20% of the batch price.
                    </p>
                </div>
                <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
                    {COUNSELLING_COURSES.map((c) => (
                        <div key={c.slug} className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                            <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">Coming soon</span>
                            <GraduationCap className="mx-auto h-7 w-7 text-indigo-500" />
                            <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{c.name}</h3>
                            <p className="text-xs text-slate-400">{c.subtitle}</p>
                            <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{rupee(c.price)}</p>
                            <span className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                <Clock size={14} /> Coming soon
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Membership — what's inside */}
            <div className="mt-14">
                <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">What&apos;s inside the membership</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {MEMBERSHIP_GROUPS.map((g, gi) => {
                        const Icon = GROUP_ICON[g.icon] || Sparkles;
                        return (
                            <motion.div
                                key={g.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.3, delay: (gi % 4) * 0.06 }}
                                whileHover={{ y: -4 }}
                                className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                        <Icon size={17} />
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.title}</h3>
                                    {g.tag && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{g.tag}</span>}
                                </div>
                                <ul className="mt-3 space-y-1.5">
                                    {g.items.map((it) => (
                                        <li key={it} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {it}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Free vs premium */}
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/40">
                <h2 className="text-center text-lg font-bold text-slate-900 dark:text-slate-100">Free to explore — sign up free to learn</h2>
                <p className="mx-auto mt-1 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                    Look around the exams, syllabus and cut-offs without an account. Make a free account to actually
                    start practising — free PYQs, mock tests and your dashboard. Go Premium when you want the full mocks,
                    notes and AI mentor.
                </p>
                <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
                    {FREE_FEATURES.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            <Check size={12} className="text-emerald-500" /> {f}
                        </span>
                    ))}
                </div>
            </div>

            {/* Success Promise + legal note */}
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">The Success Promise</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Hit the goals on your batch and complete the required prep, and if we don&apos;t deliver the promised
                    result, you get money back — the exact terms differ per exam and are shown on each course. Eligibility
                    conditions (minimum tests, PYQs, mentor guidance and counselling participation) apply.
                </p>
                <Link to="/success-promise" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                    Read the full Success Promise &amp; Terms <ArrowRight size={15} />
                </Link>
                <p className="mx-auto mt-3 flex max-w-2xl items-start justify-center gap-1.5 text-[11px] text-slate-400">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    The full Success Promise &amp; Terms are shown at checkout and must be accepted before payment.
                </p>
            </div>
        </div>
    );
}
