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
            "A OneLeet student's success story — from diploma to B.Tech through the Lateral Entry Entrance Test.",
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
                    <span className="mx-auto grid aspect-[3/4] w-40 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl font-extrabold text-white shadow-xl sm:mx-0">
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

            {/* CTA */}
            <div className="mt-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white">
                <h2 className="text-2xl font-bold">Your story could be next.</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-indigo-100">
                    Join your college-wise batch free and start with real papers, ranked mocks and a plan tied to your exam date.
                </p>
                <Link to="/register" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 transition hover:scale-[1.03]">
                    Get started <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </article>
    );
}
