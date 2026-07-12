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

const features = [
    { icon: FileText, title: "Real past papers", desc: "Actual LEET papers — practise what the exam really asks." },
    { icon: ClipboardCheck, title: "Exam-pattern mocks", desc: "Timed tests, instant scoring, every mistake explained." },
    { icon: Sparkles, title: "AI practice", desc: "Unlimited questions on any topic, any difficulty, in seconds." },
    { icon: BookOpen, title: "Smart notes", desc: "High-yield notes and flashcards for last-mile revision." },
    { icon: Trophy, title: "Leaderboard", desc: "Measure yourself against real aspirants, every day." },
    { icon: Users, title: "Mentors", desc: "Guidance from students who actually cracked LEET." },
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
        a: "So we made ours free. Every paper, every mock, every note — no paywall, ever.",
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
                {/* Live GPU shader background. Falls back to the dark layout behind it. */}
                <ShaderHero className="absolute inset-0 -z-10" />
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[#05050f]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl space-y-6"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5" /> 100% free · Built for LEET aspirants
                    </span>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl sm:text-5xl md:text-6xl">
                        Your diploma got you here.
                        <br className="hidden sm:block" />{" "}
                        <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                            We&apos;ll get you to the top.
                        </span>
                    </h1>

                    <p className="mx-auto max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
                        Everything for your Lateral Entry Entrance Test, in one place —
                        real papers, exam-pattern mocks, and an AI coach that adapts to
                        you.
                    </p>

                    <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/register"
                            className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 font-semibold text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                        >
                            Start free
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-lg border border-white/20 bg-white/10 px-7 py-3 text-center font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/20"
                        >
                            I already have an account
                        </Link>
                    </div>

                    <p className="pt-3 text-sm font-medium text-gray-400">
                        Built by a LEET rank-holder who sat exactly where you&apos;re sitting now.
                    </p>
                </motion.div>
            </section>

            {/* Real talk — the questions in a student's head, answered */}
            <section className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
                <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
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
                                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-sm text-gray-200 backdrop-blur-sm">
                                    {c.q}
                                </p>
                            </div>
                            <div className="flex justify-start">
                                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30">
                                    {c.a}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.title}
                                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all hover:border-amber-400/30 hover:bg-white/[0.07]"
                            >
                                <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                                    {f.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Closing CTA */}
                <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-700/10 p-8 text-center backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">
                        Your top college is one decision away.
                    </h3>
                    <Link
                        to="/register"
                        className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3 font-bold text-slate-900 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                        Start preparing — free
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            <Footer />
        </>
    );
}
