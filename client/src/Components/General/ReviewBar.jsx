import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Quote, Play, X, Star } from "lucide-react";
import { getReviews } from "@/Api/ReviewsApi";
import { youTubeEmbed } from "@/lib/youtube";

const ROTATE_MS = 5500;

// The fixed navbar reads this so it can sit *just below* the strip. 0 when the
// strip is hidden (no reviews / not on the landing page) → navbar returns to top.
const setBarHeight = (px) =>
    document.documentElement.style.setProperty("--reviewbar-h", `${px}px`);

// In-site player so a video review plays on OneLeet, not on youtube.com.
function ReviewPlayer({ review, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">
                        {review.title || "Student review"}
                        {review.author && <span className="ml-1 font-normal text-slate-300">· {review.author}</span>}
                    </p>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-white/10"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="aspect-video w-full bg-black">
                    <iframe
                        src={`${youTubeEmbed(review.youtubeId)}&autoplay=1`}
                        title={review.title || "Student review"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
                {review.text && <p className="px-4 py-3 text-xs leading-relaxed text-slate-300">{review.text}</p>}
            </div>
        </div>
    );
}

// A slim, animated testimonial strip pinned to the very top of the landing page,
// above the navbar. Cycles through admin-added reviews (text or video); video
// reviews open the in-site player. Renders nothing when there are no reviews.
export default function ReviewBar() {
    const { pathname } = useLocation();
    const onLanding = pathname === "/";

    const [reviews, setReviews] = useState([]);
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [playing, setPlaying] = useState(null);
    const barRef = useRef(null);

    useEffect(() => {
        if (!onLanding) return undefined;
        let active = true;
        getReviews()
            .then((r) => active && setReviews(r || []))
            .catch(() => active && setReviews([]));
        return () => {
            active = false;
        };
    }, [onLanding]);

    const show = onLanding && reviews.length > 0;

    // Publish the strip height for the navbar; reset to 0 when hidden.
    useEffect(() => {
        if (!show) {
            setBarHeight(0);
            return undefined;
        }
        const measure = () => setBarHeight(barRef.current?.offsetHeight || 0);
        measure();
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("resize", measure);
            setBarHeight(0);
        };
    }, [show, idx]);

    // Auto-rotate (paused on hover or while a video is playing). idx grows
    // unbounded and is wrapped at render, so it never needs clamping in an effect.
    useEffect(() => {
        if (!show || paused || playing || reviews.length < 2) return undefined;
        const t = setInterval(() => setIdx((i) => i + 1), ROTATE_MS);
        return () => clearInterval(t);
    }, [show, paused, playing, reviews.length]);

    if (!show) return null;
    const cur = idx % reviews.length;
    const r = reviews[cur];
    const isVideo = r.type === "video" && r.youtubeId;

    return (
        <>
            <div
                ref={barRef}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                className="fixed inset-x-0 top-0 z-[60] overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-md"
            >
                <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(60%_120%_at_15%_-20%,rgba(255,255,255,.35),transparent)]" />
                <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
                    <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide sm:inline-flex">
                        <Star size={12} className="fill-amber-300 text-amber-300" /> Reviews
                    </span>

                    <div className="relative min-w-0 flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={r._id}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="min-w-0"
                            >
                                {isVideo ? (
                                    <button
                                        onClick={() => setPlaying(r)}
                                        className="group flex min-w-0 items-center gap-2.5 text-left"
                                    >
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 transition group-hover:bg-white/30">
                                            <Play size={13} className="translate-x-[1px] fill-white text-white" />
                                        </span>
                                        <span className="min-w-0 truncate text-sm font-medium">
                                            <span className="font-semibold">{r.title}</span>
                                            {r.author && <span className="text-white/80"> — {r.author}</span>}
                                        </span>
                                        <span className="hidden shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold group-hover:bg-white/30 sm:inline">
                                            Watch ▶
                                        </span>
                                    </button>
                                ) : (
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <Quote size={15} className="shrink-0 -scale-x-100 text-white/70" />
                                        <span className="min-w-0 truncate text-sm">
                                            <span className="font-medium">{r.text}</span>
                                            {r.author && <span className="text-white/80"> — {r.author}</span>}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {reviews.length > 1 && (
                        <div className="flex shrink-0 items-center gap-1.5">
                            {reviews.map((rv, i) => (
                                <button
                                    key={rv._id}
                                    onClick={() => setIdx(i)}
                                    aria-label={`Show review ${i + 1}`}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === cur ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* "running" progress line — fills over each slide's dwell time */}
                {reviews.length > 1 && !paused && !playing && (
                    <motion.div
                        key={idx}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
                        className="absolute bottom-0 left-0 h-0.5 bg-white/60"
                    />
                )}
            </div>

            {playing && <ReviewPlayer review={playing} onClose={() => setPlaying(null)} />}
        </>
    );
}
