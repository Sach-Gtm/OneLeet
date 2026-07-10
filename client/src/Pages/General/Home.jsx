import React from "react";
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

const features = [
    {
        icon: FileText,
        title: "Previous Year Papers",
        desc: "Years of real LEET papers in one place — practice exactly what the exam asks, not guesswork.",
    },
    {
        icon: ClipboardCheck,
        title: "Real Mock Tests",
        desc: "Exam-pattern tests with instant scoring and a breakdown of every mistake, so you fix weak spots fast.",
    },
    {
        icon: Sparkles,
        title: "AI Practice",
        desc: "Generate unlimited practice questions on any topic, at any difficulty, in seconds.",
    },
    {
        icon: BookOpen,
        title: "Smart Notes",
        desc: "Crisp, high-yield notes and AI flashcards — revise more in less time, right before the exam.",
    },
    {
        icon: Trophy,
        title: "Leaderboard",
        desc: "See where you stand against fellow aspirants and turn daily practice into real momentum.",
    },
    {
        icon: Users,
        title: "Mentors",
        desc: "Learn from students who actually cracked LEET and know what works — and what to skip.",
    },
];

const Home = () => {
    return (
        <>
            {/* Hero */}
            <section className="flex min-h-screen w-full flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-3xl space-y-6"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" /> 100% Free · Built for LEET
                        aspirants
                    </span>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl sm:text-5xl md:text-6xl">
                        Turn your second chance into your{" "}
                        <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                            best chance.
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
                        Everything you need to crack the Lateral Entry Entrance Test —
                        previous-year papers, real mock tests, AI-powered practice,
                        crisp notes, and mentors who&apos;ve been exactly where you
                        are. All in one place, completely free.
                    </p>

                    <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/register"
                            className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 font-semibold text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                        >
                            Start free — it takes 30 seconds
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/login"
                            className="rounded-lg border border-white/20 bg-white/10 px-7 py-3 text-center font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/20"
                        >
                            I already have an account
                        </Link>
                    </div>

                    <p className="pt-4 text-sm font-medium tracking-wide text-gray-400">
                        Every rank-holder was once exactly where you are.
                        <br className="hidden sm:block" /> The only difference? They
                        started today.
                    </p>
                </motion.div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                <div className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        Everything you need to crack LEET — in one place
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
                        No scattered PDFs, no guesswork. Just a clear, proven path from
                        where you are to the college you want.
                    </p>
                </div>

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
                                <h3 className="text-lg font-semibold text-white">
                                    {f.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                                    {f.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Closing CTA */}
                <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-700/10 p-8 text-center">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">
                        Your dream college won&apos;t wait. Neither should you.
                    </h3>
                    <Link
                        to="/register"
                        className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3 font-bold text-slate-900 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                    >
                        Begin your preparation — free
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            <Footer />
        </>
    );
};

export default Home;
