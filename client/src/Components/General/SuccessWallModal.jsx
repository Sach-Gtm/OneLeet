import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Image as ImageIcon, Quote, Play, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PortraitImage, StudentMeta, initials, hasMeta } from "@/Components/General/successShared";

// A full-size viewer for a photo or a video, opened from the grids.
function MediaLightbox({ item, onClose }) {
    const isImage = item.type === "image";
    useEffect(() => {
        const k = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", k);
        return () => window.removeEventListener("keydown", k);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Close">
                    <X size={16} />
                </button>
                {isImage ? (
                    <img src={item.image} alt={item.title || "Student review"} className="max-h-[85vh] w-full bg-black object-contain" />
                ) : (
                    <video src={item.video} controls autoPlay playsInline className="max-h-[85vh] w-full bg-black" />
                )}
                {(item.title || item.author || hasMeta(item)) && (
                    <div className="bg-slate-950 px-4 py-3">
                        {(item.author || item.title) && <p className="text-xs font-semibold text-slate-200">{[item.author, item.title].filter(Boolean).join(" · ")}</p>}
                        <StudentMeta r={item} dark className="mt-2" />
                    </div>
                )}
            </div>
        </div>
    );
}

// One quadrant of the 2×2 wall — its own header + independently scrolling body.
function Quadrant({ icon, title, count, accent, empty, children }) {
    const Icon = icon;
    return (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <span className={`grid h-6 w-6 place-items-center rounded-lg ${accent}`}>
                    <Icon size={14} />
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{count}</span>
            </div>
            <div className="p-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
                {count === 0 ? (
                    <div className="grid min-h-[5rem] place-items-center px-3 text-center text-xs text-slate-400 dark:text-slate-500 md:h-full md:min-h-[7rem]">{empty}</div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}

// md (768px) and up gets the 2×2 wall; below that we page one section at a time.
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
    );
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const on = () => setIsDesktop(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return isDesktop;
}

// Phone view: each section is its own page. Tabs jump straight to one; Prev/Next
// steps through them. Only the active section is mounted, so switching to Videos
// is what loads the videos — the whole wall no longer loads (and scrolls) at once.
function MobilePager({ sections }) {
    const [tab, setTab] = useState(() => Math.max(0, sections.findIndex((s) => s.count > 0)));
    const active = sections[tab];
    const ActiveIcon = active.icon;
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Tabs — one per section */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white/60 px-3 py-2 [scrollbar-width:none] dark:border-slate-800 dark:bg-slate-900/60">
                {sections.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setTab(i)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${i === tab ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                        >
                            <Icon size={13} /> {s.title}
                            <span className={`rounded-full px-1.5 text-[10px] ${i === tab ? "bg-white/25 text-white" : "bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"}`}>{s.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* The active page */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {active.count === 0 ? (
                    <div className="grid min-h-[10rem] place-items-center px-4 text-center text-sm text-slate-400 dark:text-slate-500">{active.empty}</div>
                ) : (
                    active.body
                )}
            </div>

            {/* Prev / Next pager */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white/70 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                <button
                    onClick={() => setTab((t) => Math.max(0, t - 1))}
                    disabled={tab === 0}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition disabled:opacity-40 dark:text-slate-300"
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <ActiveIcon size={13} /> {tab + 1} / {sections.length}
                </span>
                <button
                    onClick={() => setTab((t) => Math.min(sections.length - 1, t + 1))}
                    disabled={tab === sections.length - 1}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 transition disabled:opacity-40 dark:text-indigo-400"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default function SuccessWallModal({ reviews = [], onClose }) {
    const [light, setLight] = useState(null);
    const isDesktop = useIsDesktop();

    // Lock body scroll + Esc to close.
    useEffect(() => {
        const k = (e) => e.key === "Escape" && !light && onClose();
        window.addEventListener("keydown", k);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", k);
            document.body.style.overflow = prev;
        };
    }, [onClose, light]);

    const photos = reviews.filter((r) => r.type === "image" && r.image);
    const texts = reviews.filter((r) => r.type === "text" && r.text);
    const videos = reviews.filter((r) => r.type === "video" && r.video);
    const cases = reviews.filter((r) => r.isCase && r.slug);

    // Each section's body, built once and shared by the desktop grid and the
    // mobile pager (only the mounted one actually renders / loads).
    const photosBody = (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {photos.map((r) => (
                <button key={r._id} onClick={() => setLight(r)} className="group text-left">
                    <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-900/10 transition group-hover:ring-indigo-400 dark:ring-white/10">
                        <PortraitImage src={r.image} alt={r.title || "Student review"} className="aspect-[3/4] w-full" rounded="rounded-lg" />
                        {hasMeta(r) && (
                            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/92 via-slate-950/35 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                {r.author && <p className="text-xs font-bold leading-tight text-white">{r.author}</p>}
                                <StudentMeta r={r} dark className="mt-1" />
                            </div>
                        )}
                    </div>
                    {(r.author || r.title) && <p className="mt-1 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">{r.author || r.title}</p>}
                </button>
            ))}
        </div>
    );

    const reviewsBody = (
        <div className="grid gap-2.5">
            {texts.map((r) => (
                <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="line-clamp-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <Quote className="mb-1 mr-1 inline h-4 w-4 -scale-x-100 text-indigo-300" />
                        {r.text}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">{initials(r.author || "O")}</span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{r.author || "OneLeet student"}</p>
                        </div>
                    </div>
                    <StudentMeta r={r} className="mt-2" />
                </div>
            ))}
        </div>
    );

    const videosBody = (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {videos.map((r) => (
                <button key={r._id} onClick={() => setLight(r)} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-900 text-left ring-1 ring-slate-900/10 dark:ring-white/10">
                    <video src={r.video} muted playsInline preload="metadata" className="h-full w-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition group-hover:scale-110">
                        <Play size={16} className="fill-white" />
                    </span>
                    {(r.author || r.title) && (
                        <div className="absolute inset-x-0 bottom-0 p-2">
                            <p className="truncate text-[11px] font-bold text-white">{r.author || r.title}</p>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );

    const casesBody = (
        <div className="grid gap-2.5">
            {cases.map((r) => (
                <Link key={r._id} to={`/success/${r.slug}`} onClick={onClose} className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                    {r.image ? (
                        <PortraitImage src={r.image} alt={r.author || "Student"} className="h-20 w-[60px] shrink-0" rounded="rounded-lg" />
                    ) : (
                        <span className="grid h-20 w-[60px] shrink-0 place-items-center rounded-lg text-lg font-extrabold text-white" style={{ backgroundImage: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>{initials(r.author)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{r.caseTitle || `How ${r.author || "a student"} cracked LEET`}</p>
                        {r.author && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.author}</p>}
                        <StudentMeta r={r} className="mt-1.5" />
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Read the story <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );

    const sections = [
        { key: "photos", icon: ImageIcon, title: "Photos", count: photos.length, accent: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300", empty: "No photo reviews yet.", body: photosBody },
        { key: "stories", icon: Sparkles, title: "Success Stories", count: cases.length, accent: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", empty: "No success stories published yet.", body: casesBody },
        { key: "reviews", icon: Quote, title: "Reviews", count: texts.length, accent: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300", empty: "No written reviews yet.", body: reviewsBody },
        { key: "videos", icon: Play, title: "Videos", count: videos.length, accent: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300", empty: "No video reviews yet.", body: videosBody },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#FAF9F6] shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-5 py-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="min-w-0">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                            <Sparkles className="h-5 w-5 shrink-0 text-amber-500" /> The Success Wall
                        </h2>
                        <p className="mt-0.5 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                            Photos, reviews, videos and full stories from OneLeet students, all in one place.
                        </p>
                    </div>
                    <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {isDesktop ? (
                    /* Desktop — all four sections at once, a 2×2 square. */
                    <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3 overflow-hidden p-4">
                        {sections.map((s) => (
                            <Quadrant key={s.key} icon={s.icon} title={s.title} count={s.count} accent={s.accent} empty={s.empty}>
                                {s.body}
                            </Quadrant>
                        ))}
                    </div>
                ) : (
                    /* Phone — one section per page, with tabs + Prev/Next. */
                    <MobilePager sections={sections} />
                )}
            </div>

            {light && <MediaLightbox item={light} onClose={() => setLight(null)} />}
        </div>
    );
}
