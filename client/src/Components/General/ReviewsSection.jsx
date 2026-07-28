import { useEffect, useRef, useState } from "react";
import { Quote, Play, Volume2, X, Star, Sparkle } from "lucide-react";
import { getReviews } from "@/Api/ReviewsApi";

// A full-size video player (with sound) for a review, opened from a card.
function ReviewVideoModal({ review, onClose }) {
    useEffect(() => {
        const k = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
                <video src={review.video} controls autoPlay playsInline className="max-h-[80vh] w-full bg-black" />
                {(review.title || review.author) && (
                    <div className="bg-slate-950 px-4 py-3 text-xs text-slate-300">
                        {[review.title, review.author].filter(Boolean).join(" · ")}
                    </div>
                )}
            </div>
        </div>
    );
}

function ReviewCard({ review, onPlay }) {
    const isVideo = review.type === "video" && review.video;
    const videoRef = useRef(null);

    // React doesn't reliably set the `muted` DOM property, and unmuted autoplay is
    // blocked — so force muted + play via the ref.
    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
        }
    }, [isVideo]);

    if (isVideo) {
        return (
            <div className="relative h-96 w-72 shrink-0 overflow-hidden rounded-2xl bg-slate-900 shadow-lg shadow-slate-300/40 dark:shadow-black/40 sm:w-80">
                <video
                    ref={videoRef}
                    src={review.video}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/25" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    <Play size={10} className="fill-white" /> Video
                </span>
                <button
                    onClick={() => onPlay(review)}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
                    aria-label="Play with sound"
                >
                    <Volume2 size={16} />
                </button>
                <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                    {review.title && <p className="line-clamp-2 text-sm font-semibold text-white">{review.title}</p>}
                    {review.author && <p className="mt-0.5 text-xs text-white/75">{review.author}</p>}
                </div>
            </div>
        );
    }

    const text = review.text || review.title || "";
    return (
        <div className="flex h-96 w-72 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-lg shadow-slate-300/40 dark:border-slate-700 dark:shadow-black/40 sm:w-80">
            <div>
                <Quote className="h-8 w-8 -scale-x-100 text-indigo-300" />
                <p className="mt-3 line-clamp-[7] text-base font-medium leading-relaxed text-slate-700">{text}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-slate-800">
                    {(review.author || "O").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                        {review.author || "OneLeet student"}
                    </p>
                    <div className="flex gap-0.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// A moving marquee of student reviews, placed near the bottom of the landing
// page. Video reviews play (muted) right in the card; tap for sound. Renders
// nothing until a real review is added.
export default function ReviewsSection() {
    const [reviews, setReviews] = useState([]);
    const [playing, setPlaying] = useState(null);

    useEffect(() => {
        getReviews()
            .then((r) => setReviews(r || []))
            .catch(() => setReviews([]));
    }, []);

    if (!reviews.length) return null;

    // Repeat so the row is wide enough to scroll seamlessly even with a few
    // reviews; render the whole set twice so translateX(-50%) loops perfectly.
    const base = reviews.length < 4 ? [...reviews, ...reviews, ...reviews] : reviews;
    const loop = [...base, ...base];
    const dur = Math.max(26, base.length * 6);

    return (
        <section className="relative overflow-hidden py-16">
            <div className="mx-auto mb-9 max-w-2xl px-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:bg-slate-900">
                    <Sparkle className="h-3.5 w-3.5" /> Reviews
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Loved by LEET aspirants
                </h2>
                <p className="mx-auto mt-2 max-w-md text-slate-500">
                    Real words from students preparing with OneLeet.
                </p>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#FAF9F6] to-transparent dark:from-[#0b1220] sm:w-24" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#FAF9F6] to-transparent dark:from-[#0b1220] sm:w-24" />
                <div className="marquee-track flex w-max gap-4 px-2" style={{ "--marquee-dur": `${dur}s` }}>
                    {loop.map((r, i) => (
                        <ReviewCard key={`${r._id}-${i}`} review={r} onPlay={setPlaying} />
                    ))}
                </div>
            </div>

            {playing && <ReviewVideoModal review={playing} onClose={() => setPlaying(null)} />}
        </section>
    );
}
