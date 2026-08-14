import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Image as ImageIcon, Quote, Play, Volume2, Sparkles, ArrowRight } from "lucide-react";
import { PortraitImage, StudentMeta, Stars, initials } from "@/Components/General/successShared";

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
                {(item.title || item.author) && (
                    <div className="bg-slate-950 px-4 py-3 text-xs text-slate-300">{[item.title, item.author].filter(Boolean).join(" · ")}</div>
                )}
            </div>
        </div>
    );
}

function Empty({ children }) {
    return <p className="col-span-full py-14 text-center text-sm text-slate-400">{children}</p>;
}

export default function SuccessWallModal({ reviews = [], initialTab = "photos", onClose }) {
    const [tab, setTab] = useState(initialTab);
    const [light, setLight] = useState(null);

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

    const TABS = [
        { key: "photos", label: "Photos", icon: ImageIcon, n: photos.length },
        { key: "reviews", label: "Reviews", icon: Quote, n: texts.length },
        { key: "videos", label: "Videos", icon: Play, n: videos.length },
        { key: "stories", label: "Success Stories", icon: Sparkles, n: cases.length },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#FAF9F6] shadow-2xl dark:border-slate-700 dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                            <Sparkles className="h-5 w-5 text-amber-500" /> The Success Wall
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Real wins from OneLeet students.</p>
                    </div>
                    <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2 dark:border-slate-800">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                                    active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                }`}
                            >
                                <Icon size={14} /> {t.label}
                                <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700"}`}>{t.n}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {tab === "photos" && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {photos.length === 0 && <Empty>No photo reviews yet.</Empty>}
                            {photos.map((r) => (
                                <button key={r._id} onClick={() => setLight(r)} className="group text-left">
                                    <PortraitImage src={r.image} alt={r.title || "Student review"} className="aspect-[3/4] w-full ring-1 ring-slate-900/10 transition group-hover:ring-indigo-400 dark:ring-white/10" />
                                    {(r.author || r.title) && (
                                        <p className="mt-1.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{r.author || r.title}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === "reviews" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {texts.length === 0 && <Empty>No written reviews yet.</Empty>}
                            {texts.map((r) => (
                                <div key={r._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                    <Quote className="h-5 w-5 -scale-x-100 text-indigo-300" />
                                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{r.text}</p>
                                    <div className="mt-3 flex items-center gap-2.5">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                                            {initials(r.author || "O")}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{r.author || "OneLeet student"}</p>
                                            <Stars size={10} />
                                        </div>
                                    </div>
                                    <StudentMeta r={r} className="mt-3" />
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "videos" && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {videos.length === 0 && <Empty>No video reviews yet.</Empty>}
                            {videos.map((r) => (
                                <button key={r._id} onClick={() => setLight(r)} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-900 text-left ring-1 ring-slate-900/10 dark:ring-white/10">
                                    <video src={r.video} muted playsInline preload="metadata" className="h-full w-full object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                    <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition group-hover:scale-110">
                                        <Play size={18} className="fill-white" />
                                    </span>
                                    {(r.author || r.title) && (
                                        <p className="absolute inset-x-0 bottom-0 truncate p-2 text-xs font-semibold text-white">{r.author || r.title}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === "stories" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {cases.length === 0 && <Empty>No success stories published yet.</Empty>}
                            {cases.map((r) => (
                                <Link
                                    key={r._id}
                                    to={`/success/${r.slug}`}
                                    onClick={onClose}
                                    className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                                >
                                    {r.image ? (
                                        <PortraitImage src={r.image} alt={r.author || "Student"} className="h-24 w-[72px] shrink-0" rounded="rounded-lg" />
                                    ) : (
                                        <span className="grid h-24 w-[72px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-extrabold text-white">
                                            {initials(r.author)}
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{r.caseTitle || `How ${r.author || "a student"} cracked LEET`}</p>
                                        {r.author && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{r.author}</p>}
                                        <StudentMeta r={r} className="mt-2" />
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            Read the story <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {light && <MediaLightbox item={light} onClose={() => setLight(null)} />}
        </div>
    );
}
