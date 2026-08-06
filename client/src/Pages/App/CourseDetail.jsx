import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Lock,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { getCourse, enroll as enrollApi, unenroll as unenrollApi } from "@/Api/CoursesApi";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function CourseDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, refresh } = useAuth();
    const { add: addToCart } = useCart();

    // Add this batch to the cart and head to the pricing/checkout flow.
    const goPremium = () => {
        addToCart({ slug: course.slug, name: course.name, price: course.price, subtitle: course.examName || "" });
        navigate("/pricing");
    };

    const [course, setCourse] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        setCourse(null);
        setNotFound(false);
        getCourse(slug)
            .then((c) => {
                if (!active) return;
                setCourse(c);
                setEnrolled(!!c.enrolled);
            })
            .catch((e) => {
                if (!active) return;
                if (e.status === 404) setNotFound(true);
                else toast.error(e.message || "Couldn't load this batch");
            });
        return () => {
            active = false;
        };
    }, [slug]);

    const doEnroll = async () => {
        // A visitor must have an account to enroll — send them to sign up, then back.
        if (!user) {
            navigate("/register", { state: { from: { pathname: `/courses/${slug}` } } });
            return;
        }
        setBusy(true);
        try {
            await enrollApi({ slug });
            await refresh(); // pull the fresh user so user.exams reflects the new batch
            setEnrolled(true);
            toast.success(`You're in — welcome to ${course.name}`);
        } catch (e) {
            toast.error(e.message || "Couldn't enroll");
        } finally {
            setBusy(false);
        }
    };

    const doUnenroll = async () => {
        setBusy(true);
        try {
            await unenrollApi(course._id);
            await refresh();
            setEnrolled(false);
            toast.success("You've left this batch");
        } catch (e) {
            toast.error(e.message || "Couldn't leave the batch");
        } finally {
            setBusy(false);
        }
    };

    if (notFound) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 pt-32 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
                <h1 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">
                    This batch isn&apos;t available
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    It may have been unpublished. Browse the batches that are open.
                </p>
                <Link
                    to="/courses"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    <ArrowLeft size={15} /> Back to batches
                </Link>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-28 sm:pt-32">
            <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
                <ArrowLeft size={15} /> All batches
            </Link>

            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        <GraduationCap size={13} /> {course.examName || "LEET"}
                    </span>
                    <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{course.name}</h1>
                    {course.tagline && (
                        <p className="mt-2 max-w-2xl text-sm text-indigo-100">{course.tagline}</p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        {enrolled ? (
                            <>
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
                                    <CheckCircle2 size={16} /> You&apos;re enrolled
                                </span>
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                                >
                                    Go to dashboard <ArrowRight size={15} />
                                </button>
                                <button
                                    onClick={doUnenroll}
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-60"
                                >
                                    {busy ? <Loader2 size={15} className="animate-spin" /> : null}
                                    Leave batch
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={doEnroll}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60"
                            >
                                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                Enroll free
                            </button>
                        )}
                        {course.price ? (
                            <button
                                type="button"
                                onClick={goPremium}
                                className="group/price inline-flex items-center gap-1 text-sm text-indigo-100 transition hover:text-white"
                            >
                                Go Premium{" "}
                                <strong className="font-semibold text-white">
                                    ₹{course.price.toLocaleString("en-IN")}
                                </strong>
                                {course.mrp > course.price && (
                                    <span className="text-indigo-200 line-through">
                                        ₹{course.mrp.toLocaleString("en-IN")}
                                    </span>
                                )}
                                <ArrowRight size={14} className="transition group-hover/price:translate-x-0.5" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* About */}
            {course.description && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        About this batch
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {course.description}
                    </p>
                </section>
            )}

            {/* What's inside */}
            {course.whatsInside?.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        What&apos;s inside
                    </h2>
                    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {course.whatsInside.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* What's included — free vs premium */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    What&apos;s included — free vs premium
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                            <CheckCircle2 size={15} /> Free — just create an account
                        </span>
                        <ul className="mt-2.5 space-y-1.5">
                            {[
                                "Exam pattern, eligibility & syllabus",
                                "Seat matrix & previous-year cut-offs",
                                "Sample past papers (PYQs)",
                                "A few free practice tests",
                                "Dashboard & rank predictor",
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/10">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            <Lock size={14} /> Premium (OneLeet Pro)
                        </span>
                        <ul className="mt-2.5 space-y-1.5">
                            {[
                                "Every full-length ranked mock",
                                "Complete PYQ archive with solutions",
                                "Premium chapter notes & formula sheets",
                                "AI mentor — doubts, weak topics, planner",
                                "Weekly live doubt class + 1:1 sessions",
                                "Counselling & interview support",
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <Lock size={12} className="mt-1 shrink-0 text-indigo-400" /> {t}
                                </li>
                            ))}
                        </ul>
                        {course.price ? (
                            <button onClick={goPremium} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                                Go Premium — ₹{course.price.toLocaleString("en-IN")} <ArrowRight size={14} />
                            </button>
                        ) : (
                            <Link to="/pricing" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                                See premium pricing <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Terms */}
            {course.termsAndConditions && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <ShieldCheck size={15} className="text-slate-400" /> Terms &amp; conditions
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {course.termsAndConditions}
                    </p>
                </section>
            )}
        </div>
    );
}
