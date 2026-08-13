import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ExternalLink, Loader2, Quote, Sparkles } from "lucide-react";
import { getMentor } from "@/Api/MentorsApi";
import { useSeo } from "@/lib/useSeo";
import TopoLines from "@/Components/General/TopoLines";

const GRADIENTS = [
    "from-indigo-500 via-violet-500 to-fuchsia-500",
    "from-sky-500 via-indigo-500 to-violet-600",
    "from-emerald-500 via-teal-500 to-sky-600",
    "from-orange-500 via-rose-500 to-fuchsia-600",
];
const gradFor = (slug = "") => GRADIENTS[[...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];

const initials = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Fade-up on scroll, reused across the page.
const rise = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] } }),
};

export default function MentorJourney() {
    const { slug } = useParams();
    // Tag the fetched result with its slug so switching mentors shows the loader
    // (result.forSlug !== slug) without a synchronous setState reset in the effect.
    const [result, setResult] = useState({ forSlug: null, mentor: null });

    useEffect(() => {
        let active = true;
        getMentor(slug)
            .then((m) => active && setResult({ forSlug: slug, mentor: m || null }))
            .catch(() => active && setResult({ forSlug: slug, mentor: null }));
        return () => {
            active = false;
        };
    }, [slug]);

    const mentor = result.forSlug === slug ? result.mentor : undefined; // undefined = loading, null = not found

    useSeo({
        title: mentor ? `${mentor.name} — ${mentor.role || "Mentor"} at OneLeet` : "Mentor Journey | OneLeet",
        description: mentor?.tagline || mentor?.description || "A OneLeet mentor's journey from diploma to B.Tech.",
        path: `/mentor/${slug}`,
    });

    if (mentor === undefined) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (mentor === null) {
        return (
            <div className="mx-auto max-w-lg px-4 py-32 text-center">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">We couldn&apos;t find that mentor.</p>
                <Link to="/mentor" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to all mentors
                </Link>
            </div>
        );
    }

    return <MentorJourneyView mentor={mentor} />;
}

// Presentational journey (exported so it can be previewed with static data).
export function MentorJourneyView({ mentor }) {
    const grad = gradFor(mentor.slug);
    const paragraphs = (mentor.story || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    return (
        <div className="relative overflow-hidden pb-24">
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            {/* `isolate` keeps the -z-10 gradient inside this hero's stacking
                context so it can't slip behind the page background. */}
            <div className="relative isolate overflow-hidden">
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${grad} opacity-95`} />
                <TopoLines color="rgb(255 255 255)" opacity={0.12} />
                {/* soft light blooms */}
                <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-10 top-24 -z-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

                <div className="mx-auto max-w-4xl px-4 pb-14 pt-28 sm:px-6 sm:pt-32">
                    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                        <Link to="/mentor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white">
                            <ArrowLeft className="h-4 w-4" /> All mentors
                        </Link>
                    </motion.div>

                    <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                            className="relative shrink-0"
                        >
                            {mentor.photo ? (
                                <img
                                    src={mentor.photo}
                                    alt={mentor.name}
                                    className="h-28 w-28 rounded-3xl object-cover shadow-2xl ring-4 ring-white/40 sm:h-32 sm:w-32"
                                />
                            ) : (
                                <span className="grid h-28 w-28 place-items-center rounded-3xl bg-white/15 text-4xl font-extrabold text-white shadow-2xl ring-4 ring-white/30 backdrop-blur-sm sm:h-32 sm:w-32">
                                    {initials(mentor.name)}
                                </span>
                            )}
                        </motion.div>

                        <div className="min-w-0">
                            {mentor.role && (
                                <motion.span
                                    variants={rise} initial="hidden" animate="show"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm"
                                >
                                    <Sparkles className="h-3.5 w-3.5" /> {mentor.role}
                                </motion.span>
                            )}
                            <motion.h1
                                variants={rise} custom={1} initial="hidden" animate="show"
                                className="mt-3 text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl"
                            >
                                {mentor.name}
                            </motion.h1>
                            {(mentor.exam || mentor.handle) && (
                                <motion.div variants={rise} custom={2} initial="hidden" animate="show" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {mentor.exam && (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                                            <BadgeCheck className="h-4 w-4" /> {mentor.exam}
                                        </span>
                                    )}
                                    {mentor.handle && <span className="text-sm text-white/70">{mentor.handle}</span>}
                                </motion.div>
                            )}
                            {mentor.tagline && (
                                <motion.p variants={rise} custom={3} initial="hidden" animate="show" className="mt-3 max-w-xl text-lg font-medium text-white/90">
                                    {mentor.tagline}
                                </motion.p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats ────────────────────────────────────────────────────── */}
            {mentor.stats?.length > 0 && (
                <div className="mx-auto -mt-8 max-w-4xl px-4 sm:px-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {mentor.stats.map((s, i) => (
                            <motion.div
                                key={i}
                                variants={rise} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                                className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-lg shadow-slate-300/30 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
                            >
                                <p className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-3xl font-extrabold text-transparent dark:from-indigo-400 dark:to-violet-400">
                                    {s.value}
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mx-auto mt-14 grid max-w-4xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_260px]">
                {/* ── The journey (animated timeline) ──────────────────────── */}
                <div>
                    <motion.h2
                        variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100"
                    >
                        <Quote className="h-5 w-5 -scale-x-100 text-indigo-500" /> The journey
                    </motion.h2>
                    <div className="relative space-y-6 border-l-2 border-dashed border-indigo-200 pl-6 dark:border-indigo-500/30">
                        {paragraphs.map((p, i) => (
                            <motion.div
                                key={i}
                                variants={rise} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
                                className="relative"
                            >
                                <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-white ring-2 ring-indigo-400 dark:bg-slate-950">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                </span>
                                <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{p}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ── Highlights + links (sticky rail) ─────────────────────── */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                    {mentor.highlights?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Highlights</p>
                            <ul className="space-y-2.5">
                                {mentor.highlights.map((h, i) => (
                                    <motion.li
                                        key={i}
                                        variants={rise} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {h}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {mentor.links?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {mentor.links.map((l, i) => (
                                <a
                                    key={i}
                                    href={l.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-slate-800"
                                >
                                    <ExternalLink className="h-4 w-4" /> {l.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <motion.div
                variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="mx-auto mt-16 max-w-4xl px-4 sm:px-6"
            >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white">
                    <TopoLines color="rgb(255 255 255)" opacity={0.1} />
                    <div className="relative">
                        <h3 className="text-2xl font-bold">Ready to write your own journey?</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-indigo-100">
                            Join your college-wise batch free and follow the same path — real papers, ranked mocks and a plan tied to your exam date.
                        </p>
                        <Link
                            to="/courses"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 transition hover:scale-[1.03] hover:bg-indigo-50"
                        >
                            Explore batches <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
