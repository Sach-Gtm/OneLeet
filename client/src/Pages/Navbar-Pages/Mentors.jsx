import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, Quote, Sparkle, ChevronDown } from "lucide-react";
import { useSeo } from "@/lib/useSeo";
import { getMentors } from "@/Api/MentorsApi";

// Shown until the API responds (and if it ever returns nothing) so the page is
// never empty. These mirror the server's founding-mentor seed.
const FALLBACK = [
    { _id: "f1", name: "Sachin Gautam", handle: "@sachingautam", exam: "IPU LEET 2025" },
    { _id: "f2", name: "Ayush", exam: "IPU LEET 2025" },
    { _id: "f3", name: "Parth Singh Shekhawat", exam: "IPU LEET 2024" },
];

const GRADIENTS = [
    "from-indigo-500 to-violet-600",
    "from-violet-500 to-orange-500",
    "from-sky-500 to-indigo-600",
    "from-emerald-500 to-sky-600",
    "from-orange-500 to-rose-600",
];

const initials = (name) =>
    (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

// One mentor. The outer div is the scroll "slot" (tracked for the shrink-as-it's
// covered effect); the inner div is sticky, so as you scroll the next card rises
// and stacks over this one — it feels like the page transforms in place while
// still scrolling normally.
function MentorCard({ mentor, index }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 120px", "end 120px"] });
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
    const grad = GRADIENTS[index % GRADIENTS.length];

    return (
        <div ref={ref} className="mb-6">
            <div className="sticky" style={{ top: `${104 + index * 16}px` }}>
                <motion.div
                    style={{ scale }}
                    initial={{ opacity: 0, y: 48 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                    className="group mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:shadow-black/40"
                >
                    <div className="flex flex-col sm:flex-row">
                        <div
                            className={`relative flex min-h-[190px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${grad} sm:min-h-[250px] sm:w-56`}
                        >
                            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
                            {mentor.photo ? (
                                <img
                                    src={mentor.photo}
                                    alt={mentor.name}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <span className="relative grid h-28 w-28 place-items-center rounded-full bg-white/15 text-3xl font-extrabold text-white ring-4 ring-white/25 backdrop-blur-sm">
                                    {initials(mentor.name)}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 p-6 sm:p-8">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Cleared {mentor.exam || "LEET"}
                            </span>
                            <h3 className="mt-3 text-2xl font-bold text-slate-900">{mentor.name}</h3>
                            {mentor.handle && <p className="text-sm text-slate-400">{mentor.handle}</p>}
                            {mentor.description ? (
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">{mentor.description}</p>
                            ) : (
                                <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500">
                                    <Quote className="mt-0.5 h-4 w-4 shrink-0 -scale-x-100 text-indigo-300" />
                                    Sat exactly where you are, and cracked it. They know precisely what it
                                    takes to get in.
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function Mentors() {
    useSeo({
        title: "LEET Mentors: Learn from students who cracked it | OneLeet",
        description:
            "Meet OneLeet's mentors, LEET qualifiers who've sat exactly where you are and know what it takes to get into 2nd year B.Tech through lateral entry.",
        path: "/mentor",
    });

    const [mentors, setMentors] = useState(null);
    useEffect(() => {
        getMentors()
            .then((list) => setMentors(list && list.length ? list : FALLBACK))
            .catch(() => setMentors(FALLBACK));
    }, []);

    const heroRef = useRef(null);
    const { scrollYProgress: heroProg } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroY = useTransform(heroProg, [0, 1], [0, 120]);
    const heroFade = useTransform(heroProg, [0, 1], [1, 0]);

    const list = mentors || FALLBACK;

    return (
        <div className="relative overflow-hidden">
            {/* Animated background wash */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
                style={{ opacity: heroFade }}
            >
                <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
                <div className="absolute right-10 top-32 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/15" />
            </motion.div>

            {/* Hero — parallaxes up + fades as you scroll into the stack */}
            <motion.div
                ref={heroRef}
                style={{ y: heroY, opacity: heroFade }}
                className="mx-auto max-w-3xl px-4 pb-10 pt-32 text-center sm:px-6"
            >
                <motion.span
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:bg-slate-900"
                >
                    <Sparkle className="h-3.5 w-3.5" /> Learn from those who cracked it
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
                >
                    Meet Your{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Mentors
                    </span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.12 }}
                    className="mx-auto mt-3 max-w-xl text-slate-500"
                >
                    LEET qualifiers who&apos;ve sat exactly where you are, and know precisely what it
                    takes to get in. Scroll to meet them.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 flex justify-center"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        className="text-slate-400"
                    >
                        <ChevronDown className="h-6 w-6" />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* The stacking cards */}
            <div className="relative mx-auto max-w-3xl px-4 pb-40 sm:px-6">
                {list.map((m, i) => (
                    <MentorCard key={m._id} mentor={m} index={i} />
                ))}
            </div>

            {/* Closing line */}
            <div className="mx-auto max-w-2xl px-4 pb-24 text-center">
                <p className="text-sm text-slate-400">
                    More mentors join every season. Each one cracked LEET and now helps you do the same.
                </p>
            </div>
        </div>
    );
}
