import { useEffect, useRef, useState } from "react";
import { Quote, Play, Volume2, X, Star, Sparkle, Image as ImageIcon } from "lucide-react";
import { getReviews } from "@/Api/ReviewsApi";

// A full-size viewer for a review's media (video with sound, or an image),
// opened from a card.
function ReviewMediaModal({ review, onClose }) {
    const isImage = review.type === "image";
    useEffect(() => {
        const k = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
                {isImage ? (
                    <img src={review.image} alt={review.title || "Student review"} className="max-h-[85vh] w-full bg-black object-contain" />
                ) : (
                    <video src={review.video} controls autoPlay playsInline className="max-h-[80vh] w-full bg-black" />
                )}
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
    const isImage = review.type === "image" && review.image;
    const videoRef = useRef(null);

    // React doesn't reliably set the `muted` DOM property, and unmuted autoplay is
    // blocked — so force muted + play via the ref.
    useEffect(() => {
        if (isVideo && videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
        }
    }, [isVideo]);

    // Uniform landscape cards (~half the old height). Videos are shot landscape,
    // so 16:9 fills cleanly; text cards share the same footprint so the row
    // stays even.
    if (isVideo) {
        return (
            <div className="relative h-40 w-72 shrink-0 overflow-hidden rounded-2xl bg-slate-900 shadow-md shadow-slate-300/40 dark:shadow-black/40">
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/20" />
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    <Play size={9} className="fill-white" /> Video
                </span>
                <button
                    onClick={() => onPlay(review)}
                    className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
                    aria-label="Play with sound"
                >
                    <Volume2 size={14} />
                </button>
                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                    {review.title && <p className="line-clamp-1 text-sm font-semibold text-white">{review.title}</p>}
                    {review.author && <p className="mt-0.5 text-xs text-white/75">{review.author}</p>}
                </div>
            </div>
        );
    }

    // Image review — same card footprint as the rest. A blurred copy fills the
    // frame so a tall screenshot doesn't leave empty bars, with the full image
    // shown uncropped (object-contain) on top. Tap to read it full-size.
    if (isImage) {
        return (
            <button
                onClick={() => onPlay(review)}
                className="group relative h-40 w-72 shrink-0 overflow-hidden rounded-2xl bg-slate-900 text-left shadow-md shadow-slate-300/40 dark:shadow-black/40"
                aria-label="Open review"
            >
                <img src={review.image} aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
                <img src={review.image} alt={review.title || "Student review"} className="relative h-full w-full object-contain" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    <ImageIcon size={9} /> Photo
                </span>
                {(review.title || review.author) && (
                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                        {review.title && <p className="line-clamp-1 text-sm font-semibold text-white">{review.title}</p>}
                        {review.author && <p className="mt-0.5 text-xs text-white/75">{review.author}</p>}
                    </div>
                )}
            </button>
        );
    }

    const text = review.text || review.title || "";
    return (
        <div className="flex h-40 w-72 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-md shadow-slate-300/40 dark:border-slate-700 dark:shadow-black/40">
            <div className="min-h-0">
                <Quote className="h-5 w-5 -scale-x-100 text-indigo-300" />
                <p className="mt-1.5 line-clamp-3 text-sm font-medium leading-snug text-slate-700">{text}</p>
            </div>
            <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-slate-800">
                    {(review.author || "O").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                        {review.author || "OneLeet student"}
                    </p>
                    <div className="flex gap-0.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
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

            {playing && <ReviewMediaModal review={playing} onClose={() => setPlaying(null)} />}
        </section>
    );
}
