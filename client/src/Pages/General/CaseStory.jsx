import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Quote } from "lucide-react";
import { getCase } from "@/Api/ReviewsApi";
import { useSeo } from "@/lib/useSeo";
import { PortraitImage, StudentMeta, initials } from "@/Components/General/successShared";

// A single student success story — its own crawlable page (/success/:slug) so it
// works as SEO content, unlike a modal.
export default function CaseStory() {
    const { slug } = useParams();
    const [result, setResult] = useState({ forSlug: null, data: null });

    useEffect(() => {
        let active = true;
        getCase(slug)
            .then((c) => active && setResult({ forSlug: slug, data: c || null }))
            .catch(() => active && setResult({ forSlug: slug, data: null }));
        return () => {
            active = false;
        };
    }, [slug]);

    const c = result.forSlug === slug ? result.data : undefined; // undefined = loading, null = not found

    useSeo({
        title: c ? `${c.caseTitle || `How ${c.author || "a student"} cracked LEET`} | OneLeet Success Story` : "Success Story | OneLeet",
        description:
            c?.caseStory?.slice(0, 155) ||
            "A OneLeet student's success story, from diploma to B.Tech through the Lateral Entry Entrance Test.",
        path: `/success/${slug}`,
    });

    if (c === undefined) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (c === null) {
        return (
            <div className="mx-auto max-w-lg px-4 py-32 text-center">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">We couldn&apos;t find that story.</p>
                <Link to="/success" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> All success stories
                </Link>
            </div>
        );
    }

    return <CaseStoryView c={c} />;
}

// Presentational story (exported so it can be previewed with static data).
export function CaseStoryView({ c }) {
    const paragraphs = (c.caseStory || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    return (
        <article className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
            <Link to="/success" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                <ArrowLeft className="h-4 w-4" /> All success stories
            </Link>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
                {c.image ? (
                    <PortraitImage src={c.image} alt={c.author || "Student"} className="mx-auto aspect-[3/4] w-40 shrink-0 shadow-xl sm:mx-0" />
                ) : (
                    <span
                        className="mx-auto grid aspect-[3/4] w-40 shrink-0 place-items-center rounded-xl text-4xl font-extrabold text-white shadow-xl sm:mx-0"
                        style={{ backgroundImage: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                    >
                        {initials(c.author)}
                    </span>
                )}
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                        Success story
                    </span>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        {c.caseTitle || `How ${c.author || "a student"} cracked LEET`}
                    </h1>
                    {c.author && <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{c.author}</p>}
                    <StudentMeta r={c} className="mt-3" />
                </div>
            </div>

            {/* Their words, as a pull-quote. */}
            {c.text && (
                <blockquote className="mt-8 rounded-2xl border-l-4 border-indigo-400 bg-indigo-50/60 p-5 dark:border-indigo-500/50 dark:bg-indigo-500/5">
                    <Quote className="h-5 w-5 -scale-x-100 text-indigo-400" />
                    <p className="mt-1.5 text-base font-medium italic leading-relaxed text-slate-700 dark:text-slate-200">{c.text}</p>
                </blockquote>
            )}

            {/* The story. */}
            <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
                {paragraphs.map((p, i) => (
                    <p key={i} className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{p}</p>
                ))}
            </div>

            {/* Their video, if any. */}
            {c.video && (
                <div className="mt-8 overflow-hidden rounded-2xl bg-black">
                    <video src={c.video} controls playsInline className="max-h-[70vh] w-full" />
                </div>
            )}

            {/* CTA — a designed panel: a clean sRGB indigo→violet gradient (set
                inline so it renders predictably, not through Tailwind's OKLCH
                violet), soft glows, a dot grid and a rising "all the way to the
                top" line drawn in inline SVG. */}
            <div
                className="relative mt-12 overflow-hidden rounded-3xl px-8 py-10 text-center text-white shadow-xl shadow-indigo-900/25"
                style={{ backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 52%, #7c3aed 100%)" }}
            >
                {/* soft colour glows */}
                <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(165,180,252,0.45), transparent 70%)" }} />
                <div className="pointer-events-none absolute -bottom-24 -right-10 h-60 w-60 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(196,181,253,0.40), transparent 70%)" }} />

                {/* decorative scene */}
                <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <pattern id="cta-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                            <circle cx="1.6" cy="1.6" r="1.6" fill="#fff" opacity="0.10" />
                        </pattern>
                        <linearGradient id="cta-rise" x1="0" y1="1" x2="1" y2="0">
                            <stop offset="0" stopColor="#fbbf24" stopOpacity="0" />
                            <stop offset="0.5" stopColor="#fbbf24" stopOpacity="0.55" />
                            <stop offset="1" stopColor="#fde68a" stopOpacity="0.95" />
                        </linearGradient>
                    </defs>
                    <rect width="400" height="220" fill="url(#cta-dots)" />
                    {/* rising path, echoing "to the top" */}
                    <path d="M-10 200 C 90 190, 150 150, 220 120 S 340 60, 420 24" fill="none" stroke="url(#cta-rise)" strokeWidth="2.5" strokeLinecap="round" />
                    {/* a few climbing milestone dots along the way */}
                    <circle cx="120" cy="168" r="3" fill="#fde68a" opacity="0.7" />
                    <circle cx="220" cy="120" r="3.5" fill="#fde68a" opacity="0.85" />
                    <circle cx="320" cy="70" r="4" fill="#fde68a" />
                    {/* star at the summit */}
                    <path d="M392 20 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1 z" fill="#fbbf24" />
                </svg>

                <div className="relative z-10">
                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                            <path d="M12 2.5l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 17.9 6.1 20.8l1.7-6.6L2.6 9.8l6.8-.5L12 2.5z" fill="#fde68a" stroke="#fbbf24" strokeWidth="0.5" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Your story could be next.</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-indigo-100">
                        Join your college-wise batch free and start with real papers, ranked mocks and a plan tied to your exam date.
                    </p>
                    <Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg shadow-black/10 transition hover:scale-[1.03]">
                        Get started <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
