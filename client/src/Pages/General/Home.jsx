import { lazy, Suspense, useEffect } from "react";
import {
    ArrowRight,
    FileText,
    ClipboardCheck,
    Brain,
    GraduationCap,
    BookOpen,
    Trophy,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import HomeCourses from "@/Components/General/HomeCourses";
import HomeFaq from "@/Components/General/HomeFaq";
import { Cloud, Connector, RobotBuddy } from "@/Components/General/FeatureBuddy";
import CollegeCtaBand from "@/Components/General/CollegeCtaBand";
import { useSeo } from "@/lib/useSeo";
import { track } from "@/lib/telemetry";
import ScholarshipSplash from "@/Components/General/ScholarshipSplash";

// Heavy, non-critical pieces loaded off the critical path so the hero (the LCP)
// paints fast: the WebGL shader background (ogl) and the below-the-fold sections
// (which also pull framer-motion). This keeps ogl + framer-motion out of the
// landing entry chunk entirely.
const ShaderHero = lazy(() => import("@/Components/General/ShaderHero"));
const JourneyReveal = lazy(() => import("@/Components/General/JourneyReveal"));
const SuccessWall = lazy(() => import("@/Components/General/SuccessWall"));

const features = [
    { icon: FileText, title: "Real past papers", desc: "Actual LEET papers. Practise what the exam really asks.", tint: "bg-indigo-50 border-indigo-100", iconBg: "bg-indigo-500" },
    { icon: ClipboardCheck, title: "Exam-pattern mocks", desc: "Timed tests, instant scoring, every mistake explained.", tint: "bg-rose-50 border-rose-100", iconBg: "bg-rose-500" },
    { icon: Brain, title: "AI practice", desc: "Unlimited questions on any topic, any difficulty, in seconds.", tint: "bg-violet-50 border-violet-100", iconBg: "bg-violet-500" },
    { icon: BookOpen, title: "Smart notes", desc: "High-yield notes and flashcards for last-mile revision.", tint: "bg-teal-50 border-teal-100", iconBg: "bg-teal-500" },
    { icon: Trophy, title: "Leaderboard", desc: "Measure yourself against real aspirants, every day.", tint: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-500" },
    { icon: Users, title: "Mentors", desc: "Guidance from students who actually cracked LEET.", tint: "bg-sky-50 border-sky-100", iconBg: "bg-sky-500" },
];

// Short, honest exchanges — the way a student actually asks, and the way
// OneLeet answers. Kept deliberately light.
const conversation = [
    {
        q: "Honestly, I don't know where to begin.",
        a: "Open one real past paper. In ten minutes you'll see exactly what LEET tests, and what you can ignore.",
    },
    {
        q: "Coaching is way too expensive for me.",
        a: "You don't need pricey coaching to crack this. Real papers, mocks, and an AI coach. All in one place, built around you.",
    },
    {
        q: "What if I've already left it too late?",
        a: "You haven't. Our AI builds a plan around the days you actually have. It starts the moment you do.",
    },
];

export default function Home() {
    useSeo({
        title: "OneLeet: AI-powered LEET / Lateral Entry Entrance Test preparation",
        description:
            "Crack LEET and get into 2nd year B.Tech after your diploma. Free past papers, exam-pattern mock tests, notes and AI practice for every state.",
        path: "/",
    });
    // Funnel: top-of-funnel landing view (audit C3).
    useEffect(() => {
        track("land");
    }, []);
    return (
        <>
            <ScholarshipSplash />

            {/* Hero */}
            <section className="relative flex min-h-[86vh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-24 text-center sm:px-6 sm:pt-28">
                {/* Instant pastel backdrop — paints immediately with no JS, so the
                    hero (the LCP) never waits on WebGL. The GPU shader fades in
                    over it once its chunk has loaded. */}
                <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,#d3f2fb_0%,#eef2ff_32%,#FAF9F6_68%)] dark:bg-slate-950" />
                {/* Live GPU shader wash, loaded off the critical path. */}
                <Suspense fallback={null}>
                    <ShaderHero className="absolute inset-0 -z-10" />
                </Suspense>
                {/* In dark mode the shader stays light, so lay a dark scrim over it
                    to keep the hero text readable. */}
                <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-slate-950/85 dark:block" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#FAF9F6] dark:to-slate-950" />

                <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                        <GraduationCap className="h-3.5 w-3.5" /> Built for LEET aspirants
                    </span>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
                        Your{" "}
                        <mark className="mx-0.5 inline-block rounded-lg bg-amber-300 px-3 py-1 italic leading-none text-slate-900 shadow-sm shadow-amber-600/25">
                            Diploma
                        </mark>{" "}
                        got you here.
                        <br className="hidden sm:block" />{" "}
                        {/* Brand two-tone (blue phrase + orange accent word). In this
                            theme `indigo` is brand blue and `violet` is brand orange, so
                            the old `from-indigo-600 to-violet-600` was a blue→orange
                            gradient, and those are near-complementary, so it interpolated
                            through a muddy grey that read badly (especially in dark mode).
                            Two clean brand colours echo the logo and stay vivid on light
                            and dark; brighter tints in dark so they glow on the navy. */}
                        <span className="text-indigo-600 dark:text-indigo-300">
                            We&apos;ll get you to the{" "}
                        </span>
                        <span className="text-violet-600 dark:text-violet-400">top.</span>
                    </h1>

                    <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                        Everything for your Lateral Entry Entrance Test, in one place:
                        real papers, exam-pattern mocks, and an AI coach that adapts to
                        you.
                    </p>

                    <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/register"
                            onClick={() => track("cta_click", { where: "hero" })}
                            className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                        >
                            Get started
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-lg border border-slate-200 bg-white px-7 py-3 text-center font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            I already have an account
                        </Link>
                    </div>

                    <p className="pt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Built by a LEET rank-holder who sat exactly where you&apos;re sitting now.
                    </p>
                </div>
            </section>

            {/* Real talk — the questions in a student's head, answered */}
            <section className="mx-auto max-w-2xl px-4 pb-14 sm:px-6">
                <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                    The questions in your head, answered.
                </h2>
                <div className="space-y-5">
                    {conversation.map((c, i) => (
                        <div
                            key={i}
                            className="space-y-2 animate-fade-up"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <div className="flex justify-end">
                                <p className="max-w-[80%] rounded-2xl rounded-br-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                                    {c.q}
                                </p>
                            </div>
                            <div className="flex justify-start">
                                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20">
                                    {c.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* The journey — 10th → Diploma → B.Tech → gates opening to the
                companies it can lead to. Aspiration, not a placement claim. */}
            <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                        From 10th to your dream company.
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
                        Class 10 → Diploma → B.Tech through LEET. From there, the doors
                        you always dreamed of start to open.
                    </p>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/70 p-2 shadow-sm animate-fade-up sm:p-4">
                    <Suspense fallback={<div className="h-56 w-full" />}>
                        <JourneyReveal className="block h-auto w-full" />
                    </Suspense>
                </div>
            </section>

            {/* College-wise batches — browsable + free to join without login */}
            <HomeCourses />

            {/* Features — the OneLeet buddy: a friendly robot with the six
                tools connected around it, under a soft sky with drifting
                clouds. Pure SVG + CSS motion (no images, no framer here). */}
            <section className="relative overflow-hidden pb-16">
                {/* sky wash + clouds (full-bleed, decorative) */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-sky-100/70 to-transparent dark:via-slate-900/70"
                />
                <Cloud className="left-[6%] top-10 w-40" dur="34s" />
                <Cloud className="right-[8%] top-24 w-56" dur="46s" delay="-12s" />
                <Cloud className="left-[40%] top-2 hidden w-32 sm:block" dur="40s" delay="-25s" />

                <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6">
                    <div className="text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-semibold text-sky-700 backdrop-blur dark:border-sky-500/30 dark:bg-slate-900/60 dark:text-sky-300">
                            Meet your prep buddy
                        </span>
                        <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                            Everything you need to crack LEET
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
                            One system that plans your prep, drills you on real papers and
                            keeps a mentor within reach.
                        </p>
                    </div>

                    <div className="mt-8 gap-6 lg:grid lg:grid-cols-[1fr_15rem_1fr] lg:items-center">
                        {/* the buddy: first on mobile, centre column on desktop */}
                        <div className="lg:col-start-2 lg:row-start-1">
                            <RobotBuddy className="mx-auto mb-8 w-36 sm:w-40 lg:mb-0 lg:w-48" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:col-start-1 lg:row-start-1 lg:grid-cols-1 lg:gap-6">
                            {features.slice(0, 3).map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className={`group relative rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-md dark:border-white/10 ${f.tint}`}
                                    >
                                        <Connector side="right" className="hidden lg:block" />
                                        <span className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm ${f.iconBg}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                            {f.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:grid-cols-1 lg:gap-6">
                            {features.slice(3).map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className={`group relative rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-md dark:border-white/10 ${f.tint}`}
                                    >
                                        <Connector side="left" className="hidden lg:block" />
                                        <span className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm ${f.iconBg}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                            {f.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Closing CTA — campus-collage band: real college photos drift
                    behind a brand scrim, so it reads the same in light and dark. */}
                <CollegeCtaBand />
            </section>

            {/* The Success Wall — a compact 3D strip of student wins; opens the
                full wall (photos / reviews / videos / stories) on click. */}
            <Suspense fallback={null}>
                <SuccessWall />
            </Suspense>

            {/* SEO FAQ — the last section before the footer. */}
            <HomeFaq />
        </>
    );
}
