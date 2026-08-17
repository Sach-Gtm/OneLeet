import { lazy, Suspense, useEffect, useState } from "react";
import { Sparkles, ArrowRight, Quote } from "lucide-react";
import { getReviews } from "@/Api/ReviewsApi";
import { PortraitImage } from "@/Components/General/successShared";

const SuccessWallModal = lazy(() => import("@/Components/General/SuccessWallModal"));

// One portrait frame in the running strip — a polaroid-ish white frame so the
// photos read as a physical "wall".
function Frame({ r }) {
    return (
        <div className="w-28 shrink-0 rounded-xl bg-white p-1.5 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10 sm:w-32">
            <PortraitImage src={r.image} alt={r.author || "Student"} className="aspect-[3/4] w-full" rounded="rounded-lg" />
            {r.author && <p className="truncate px-0.5 pt-1 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">{r.author}</p>}
        </div>
    );
}

export default function SuccessWall({ reviews: injected }) {
    const [fetched, setFetched] = useState(null); // null = still loading
    const [open, setOpen] = useState(false);
    const reviews = injected || fetched || [];

    useEffect(() => {
        if (injected) return; // caller supplied data (e.g. a preview)
        getReviews().then((r) => setFetched(r || [])).catch(() => setFetched([]));
    }, [injected]);

    // Skeleton strip while loading so the wall holds its space on a cold start.
    if (!injected && fetched === null) {
        return (
            <section className="py-14">
                <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center gap-2 px-4">
                    <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
                <div className="flex justify-center gap-4 px-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`aspect-[3/4] w-28 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${i > 2 ? "hidden sm:block" : ""}`} />
                    ))}
                </div>
            </section>
        );
    }

    if (!reviews.length) return null;

    const images = reviews.filter((r) => r.image);
    const texts = reviews.filter((r) => r.type === "text" && r.text);
    // Repeat so the 3D strip is wide enough to loop seamlessly.
    const base = images.length && images.length < 8 ? [...images, ...images, ...images] : images;
    const loop = [...base, ...base];
    const dur = Math.max(30, base.length * 4);

    return (
        <section className="relative overflow-hidden border-y border-amber-200/60 bg-gradient-to-b from-amber-50/70 via-[#FAF9F6] to-indigo-50/50 py-16 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
            <div className="mx-auto mb-8 max-w-2xl px-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" /> The Success Wall
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Real students. Real results.
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Screenshots, reviews and full stories from OneLeet students who made it.
                </p>
            </div>

            {images.length > 0 ? (
                // A 3D running strip of portrait photos — click anywhere to open the wall.
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Open the Success Wall"
                    className="group relative block w-full cursor-pointer [perspective:1400px]"
                >
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#FAF9F6] to-transparent dark:from-slate-950 sm:w-28" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#FAF9F6] to-transparent dark:from-slate-950 sm:w-28" />
                    <div className="py-4 [transform:rotateX(9deg)_rotateY(-9deg)_rotateZ(-1.5deg)] [transform-style:preserve-3d]">
                        <div className="marquee-track flex w-max gap-4 px-4" style={{ "--marquee-dur": `${dur}s` }}>
                            {loop.map((r, i) => (
                                <Frame key={`${r._id}-${i}`} r={r} />
                            ))}
                        </div>
                    </div>
                </button>
            ) : (
                // No photos yet — a small taste of the written reviews instead.
                <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3 px-4">
                    {texts.slice(0, 3).map((r) => (
                        <button key={r._id} onClick={() => setOpen(true)} className="flex h-32 w-64 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                            <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-300"><Quote className="mb-1 inline h-4 w-4 -scale-x-100 text-indigo-300" /> {r.text}</p>
                            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{r.author || "OneLeet student"}</p>
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-8 text-center">
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:scale-[1.03]"
                >
                    See the whole wall <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            {open && (
                <Suspense fallback={null}>
                    <SuccessWallModal reviews={reviews} onClose={() => setOpen(false)} />
                </Suspense>
            )}
        </section>
    );
}
