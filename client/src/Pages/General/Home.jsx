import { motion } from "framer-motion";
import {
    ArrowRight,
    FileText,
    ClipboardCheck,
    Sparkles,
    BookOpen,
    Trophy,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/Components/General/Footer";
import ShaderHero from "@/Components/General/ShaderHero";
import CircuitCanvas from "@/Components/General/CircuitCanvas";

const features = [
    { icon: FileText, title: "Real past papers", desc: "Actual LEET papers — practise what the exam really asks.", tint: "bg-indigo-50 border-indigo-100", iconBg: "bg-indigo-500" },
    { icon: ClipboardCheck, title: "Exam-pattern mocks", desc: "Timed tests, instant scoring, every mistake explained.", tint: "bg-rose-50 border-rose-100", iconBg: "bg-rose-500" },
    { icon: Sparkles, title: "AI practice", desc: "Unlimited questions on any topic, any difficulty, in seconds.", tint: "bg-violet-50 border-violet-100", iconBg: "bg-violet-500" },
    { icon: BookOpen, title: "Smart notes", desc: "High-yield notes and flashcards for last-mile revision.", tint: "bg-amber-50 border-amber-100", iconBg: "bg-amber-500" },
    { icon: Trophy, title: "Leaderboard", desc: "Measure yourself against real aspirants, every day.", tint: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-500" },
    { icon: Users, title: "Mentors", desc: "Guidance from students who actually cracked LEET.", tint: "bg-sky-50 border-sky-100", iconBg: "bg-sky-500" },
];

// Short, honest exchanges — the way a student actually asks, and the way
// OneLeet answers. Kept deliberately light.
const conversation = [
    {
        q: "Honestly, I don't know where to begin.",
        a: "Open one real past paper. In ten minutes you'll see exactly what LEET tests — and what you can ignore.",
    },
    {
        q: "Coaching is way too expensive for me.",
        a: "You don't need pricey coaching to crack this. Real papers, mocks, and an AI coach — all in one place, built around you.",
    },
    {
        q: "What if I've already left it too late?",
        a: "You haven't. Our AI builds a plan around the days you actually have. It starts the moment you do.",
    },
];

export default function Home() {
    return (
        <>
            {/* Hero */}
            <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
                {/* Live GPU shader wash (falls back to the light layout behind it). */}
                <ShaderHero className="absolute inset-0 -z-10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#FAF9F6]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl space-y-6"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5" /> Built for LEET aspirants
                    </span>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                        Your diploma got you here.
                        <br className="hidden sm:block" />{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            We&apos;ll get you to the top.
                        </span>
                    </h1>

                    <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                        Everything for your Lateral Entry Entrance Test, in one place —
                        real papers, exam-pattern mocks, and an AI coach that adapts to
                        you.
                    </p>

                    <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/register"
                            className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                        >
                            Get started
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-lg border border-slate-200 bg-white px-7 py-3 text-center font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                        >
                            I already have an account
                        </Link>
                    </div>

                    <p className="pt-3 text-sm font-medium text-slate-500">
                        Built by a LEET rank-holder who sat exactly where you&apos;re sitting now.
                    </p>
                </motion.div>
            </section>

            {/* Real talk — the questions in a student's head, answered */}
            <section className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
                <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                    The questions in your head — answered.
                </h2>
                <div className="space-y-5">
                    {conversation.map((c, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className="space-y-2"
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
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Living circuit — a wordless nod to the maker's edge: things that
                get built, and work. Feeling over words, so no caption. */}
            <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/60 shadow-sm"
                >
                    <CircuitCanvas className="block h-32 w-full sm:h-40" />
                    {/* soft edge fade so the traces melt into the panel */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/80 to-transparent" />
                </motion.div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.title}
                                className={`group rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-md ${f.tint}`}
                            >
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

                {/* Closing CTA */}
                <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 text-center">
                    <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        Your top college is one decision away.
                    </h3>
                    <Link
                        to="/register"
                        className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                        Start preparing
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            <Footer />
        </>
    );
}
