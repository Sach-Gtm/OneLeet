import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, GraduationCap, ArrowRight } from "lucide-react";
import { COLLEGES } from "@/data/colleges";

// A gradient fallback for colleges without a photo (and while one loads / if it
// fails). Deterministic per index so it doesn't churn on re-render.
const GRADIENTS = [
    "from-indigo-600 to-violet-600", "from-cyan-700 to-sky-600", "from-rose-700 to-orange-600",
    "from-blue-700 to-blue-500", "from-violet-700 to-fuchsia-600", "from-teal-700 to-emerald-600",
];

function CollegeCard({ c, i }) {
    const [imgOk, setImgOk] = useState(true);
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: Math.min((i % 6) * 0.04, 0.2) }}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
            <div className={`relative h-28 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}>
                {c.image && imgOk && (
                    <img
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        onError={() => setImgOk(false)}
                        className="h-full w-full object-cover"
                    />
                )}
                <span className="absolute left-3 top-3 rounded-md bg-black/35 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {c.initials}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={12} /> {c.place} · {c.tag}
                </p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {c.fact}
                </p>
            </div>
        </motion.div>
    );
}

export default function Colleges() {
    return (
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:pt-32">
            <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <GraduationCap size={13} /> Where LEET can take you
                </span>
                <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Colleges you can reach through lateral entry
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    The same degrees the JEE grind is chasing — DTU, NSUT, VJTI, IPU and more — reachable
                    as a diploma holder through LEET. Aspiration, not a placement guarantee.
                </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {COLLEGES.map((c, i) => (
                    <CollegeCard key={c.name} c={c} i={i} />
                ))}
            </div>

            <div className="mt-10 text-center">
                <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                    Start your batch <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}
