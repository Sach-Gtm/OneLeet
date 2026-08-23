import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    MonitorPlay,
    Play,
    Plus,
    Pencil,
    Trash2,
    X,
    Lock,
    Crown,
    ListFilter,
    Layers,
    SlidersHorizontal,
    Maximize,
    Minimize,
    CheckCircle2,
    RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { isStaff as isStaffUser } from "@/lib/roles";
import { getVideos, deleteVideo, updateVideo, saveVideoProgress, toggleVideoComplete } from "@/Api/VideosApi";
import { getExams } from "@/Api/ExamsApi";
import { youTubeThumb, youTubeEmbed } from "@/lib/youtube";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";
import VideoEditorModal from "@/Components/App/VideoEditorModal";
import BulkVideoModal from "@/Components/App/BulkVideoModal";
import VideoFilterGate from "@/Components/App/VideoFilterGate";
import ProtectedContent from "@/Components/Security/ProtectedContent";

const FILTER_KEY = "oneleet.videoFilter.v1";
const ALL_FILTER = { exam: "all", subject: "all", chapter: "all" };

// A video with no targets (or ["all"]) is meant for every exam, so it shows under
// any exam a student picks as well as the "all" view.
const isUniversalVideo = (v) => !v.targets?.length || v.targets.includes("all");
const videoInExam = (v, exam) => exam === "all" || isUniversalVideo(v) || (v.targets || []).includes(exam);
const matchesFilter = (v, f) =>
    videoInExam(v, f.exam) &&
    (f.subject === "all" || (v.subject?.trim() || "General") === f.subject) &&
    (f.chapter === "all" || (v.chapter?.trim() || "") === f.chapter);

// Loads the YouTube IFrame API once so we can read playback time for progress.
// Everything that uses it is guarded — if it never loads, the video still plays,
// we just don't auto-track the percent (manual "mark complete" still works).
let ytApiPromise = null;
function loadYouTubeAPI() {
    if (typeof window === "undefined") return Promise.reject(new Error("no window"));
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve, reject) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            try { prev && prev(); } catch { /* ignore */ }
            resolve(window.YT);
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.onerror = () => reject(new Error("yt api failed to load"));
        document.head.appendChild(tag);
    });
    return ytApiPromise;
}

// The in-site player: a YouTube embed in a branded modal so students watch inside
// OneLeet instead of being sent to youtube.com. Closes on Escape / click outside.
function PlayerModal({ video, onClose, onProgress, guarded = false }) {
    // The watermarked stage — fullscreening THIS (not the bare iframe) keeps the
    // identity overlay on screen even in fullscreen.
    const stageRef = useRef(null);
    const iframeRef = useRef(null);
    const [isFs, setIsFs] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const onFs = () => setIsFs(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onFs);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("fullscreenchange", onFs);
        };
    }, [onClose]);

    // Track watch progress via the YouTube IFrame API — fully guarded, so if the
    // API is blocked/fails the video still plays and we simply don't auto-track.
    useEffect(() => {
        if (!video?.youtubeId || !onProgress) return undefined;
        let player = null;
        let interval = null;
        let disposed = false;
        let watched = 0;
        let duration = 0;
        const report = () => { if (duration > 0 && watched > 0) onProgress(watched, duration); };
        loadYouTubeAPI()
            .then((YT) => {
                if (disposed || !iframeRef.current || !YT?.Player) return;
                try {
                    player = new YT.Player(iframeRef.current, {
                        events: {
                            onReady: () => { try { duration = player.getDuration() || 0; } catch { /* ignore */ } },
                            onStateChange: (e) => {
                                try {
                                    duration = player.getDuration() || duration;
                                    if (e?.data === YT.PlayerState?.ENDED) { watched = duration; report(); }
                                } catch { /* ignore */ }
                            },
                        },
                    });
                    interval = setInterval(() => {
                        try {
                            const t = player.getCurrentTime ? player.getCurrentTime() : 0;
                            duration = (player.getDuration ? player.getDuration() : 0) || duration;
                            if (t > watched) watched = t;
                            report();
                        } catch { /* ignore */ }
                    }, 8000);
                } catch { /* YT init failed, the iframe still plays */ }
            })
            .catch(() => { /* API blocked, no auto-tracking */ });
        return () => {
            disposed = true;
            if (interval) clearInterval(interval);
            report(); // final save on close
            try { player && player.destroy && player.destroy(); } catch { /* ignore */ }
        };
    }, [video, onProgress]);

    if (!video) return null;
    const meta = [video.subject, video.chapter, video.topic].filter(Boolean).join(" · ");

    const toggleFullscreen = () => {
        const el = stageRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else el.requestFullscreen?.().catch(() => {});
    };

    // For guarded (premium) videos we must not let the video escape the watermark
    // overlay: native fullscreen and picture-in-picture both render the raw video
    // outside our DOM, so disable them and offer a watermarked custom fullscreen
    // instead. `fs=0` also hides YouTube's own fullscreen button.
    const src = `${youTubeEmbed(video.youtubeId)}&autoplay=1&enablejsapi=1${guarded ? "&fs=0" : ""}`;
    const allow = guarded
        ? "accelerometer; autoplay; encrypted-media; gyroscope"
        : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{video.title}</p>
                    <button onClick={onClose} className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-white/10" aria-label="Close player">
                        <X size={18} />
                    </button>
                </div>
                <div ref={stageRef} className="relative flex items-center justify-center bg-black">
                    <ProtectedContent
                        enabled={guarded}
                        contentType="video"
                        contentRef={video.title || video.youtubeId || ""}
                        className="aspect-video w-full bg-black"
                    >
                        <iframe
                            ref={iframeRef}
                            src={src}
                            title={video.title}
                            className="h-full w-full"
                            allow={allow}
                            allowFullScreen={!guarded}
                        />
                    </ProtectedContent>
                    {guarded && (
                        <button
                            onClick={toggleFullscreen}
                            className="absolute right-2 top-2 z-30 rounded-md bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70"
                            aria-label={isFs ? "Exit fullscreen" : "Fullscreen"}
                            title={isFs ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFs ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    )}
                </div>
                {(meta || video.description) && (
                    <div className="px-4 py-3">
                        {meta && <p className="text-xs font-medium text-slate-300">{meta}</p>}
                        {video.description && <p className="mt-1 text-xs leading-relaxed text-slate-400">{video.description}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact lecture card — small enough to show 4–5 per row on a laptop and 2 on a
// phone. Staff controls reveal on hover so the grid stays clean for students.
function VideoCard({ video, staff, onPlay, onEdit, onDelete, onTogglePremium, onToggleComplete }) {
    const locked = !!video.locked;
    const chapter = video.chapter?.trim();
    const prog = video.progress || { percent: 0, completed: false };
    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
            <div className="relative aspect-video overflow-hidden bg-slate-900">
                <button onClick={() => onPlay(video)} className="absolute inset-0 h-full w-full" aria-label={locked ? `Unlock ${video.title}` : `Play ${video.title}`}>
                    {locked ? (
                        <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-800 to-slate-950">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/90 shadow-md transition group-hover:scale-110">
                                <Lock className="h-4 w-4 text-white" />
                            </span>
                        </span>
                    ) : (
                        <>
                            <img src={youTubeThumb(video.youtubeId)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
                                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md transition group-hover:scale-110">
                                    <Play className="h-4 w-4 translate-x-0.5 text-indigo-600" fill="currentColor" />
                                </span>
                            </span>
                        </>
                    )}
                </button>
                <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex gap-1">
                    {!video.published && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Draft</span>}
                    {video.premium && <PremiumBadge locked={locked} />}
                </div>
                {staff && (
                    <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition duration-150 focus-within:opacity-100 group-hover:opacity-100">
                        <button
                            onClick={() => onTogglePremium(video)}
                            className={"grid h-6 w-6 place-items-center rounded-md shadow-sm transition " + (video.premium ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white text-slate-600 hover:bg-white hover:text-amber-600")}
                            aria-label={video.premium ? "Make free" : "Make premium"}
                            title={video.premium ? "Premium, click to make Free" : "Free, click to make Premium"}
                        >
                            <Crown size={12} />
                        </button>
                        <button onClick={() => onEdit(video)} className="grid h-6 w-6 place-items-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-white hover:text-indigo-600" aria-label="Edit video">
                            <Pencil size={12} />
                        </button>
                        <button onClick={() => onDelete(video)} className="grid h-6 w-6 place-items-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-white hover:text-rose-500" aria-label="Delete video">
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
                {prog.percent > 0 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/25">
                        <div className={"h-full " + (prog.completed ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${prog.percent}%` }} />
                    </div>
                )}
            </div>
            <button onClick={() => onPlay(video)} className="flex flex-1 flex-col p-2.5 text-left">
                {chapter && <p className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-indigo-500">{chapter}</p>}
                <p className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug text-slate-800">{video.title}</p>
                <p className="mt-auto pt-1 truncate text-[11px] text-slate-400">{video.author || "OneLeet"}</p>
            </button>
            {!staff && !locked && onToggleComplete && (
                <div className="border-t border-slate-100 px-2.5 py-1.5">
                    {prog.completed ? (
                        <button onClick={() => onToggleComplete(video)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700" title="Mark as not done">
                            <CheckCircle2 size={12} /> Completed <RotateCcw size={10} className="text-slate-400" />
                        </button>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] text-amber-600">
                                {prog.percent > 0 ? `${prog.percent}% · finish your lecture` : "Complete your lecture"}
                            </span>
                            <button onClick={() => onToggleComplete(video)} className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:underline">Mark done</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Videos() {
    const { user } = useAuth();
    const staff = isStaffUser(user);

    const [videos, setVideos] = useState(null);
    const [examList, setExamList] = useState([]);
    const [filter, setFilter] = useState(() => {
        try {
            const s = sessionStorage.getItem(FILTER_KEY);
            return s ? JSON.parse(s) : null;
        } catch {
            return null;
        }
    });
    const [changeOpen, setChangeOpen] = useState(false); // gate reopened via "Change filters"
    const [bulkOpen, setBulkOpen] = useState(false);
    const [playing, setPlaying] = useState(null);
    const [editing, setEditing] = useState(null); // { video } | { video: null } for new
    const [busyId, setBusyId] = useState(null);
    const [premiumGate, setPremiumGate] = useState(null); // premium video a free student tapped

    const load = () => getVideos().then(setVideos).catch(() => setVideos([]));

    const play = (v) => (v.locked ? setPremiumGate(v) : setPlaying(v));

    const togglePremium = async (video) => {
        try {
            await updateVideo(video._id, { premium: !video.premium });
            toast.success(video.premium ? "Now Free" : "Now Premium");
            load();
        } catch (e) {
            toast.error(e.message || "Couldn't update the video.");
        }
    };

    // Save watch progress for the currently-playing video (best-effort, silent).
    const onProgress = useCallback(
        (watchedSeconds, durationSeconds) => {
            if (playing?._id) saveVideoProgress(playing._id, { watchedSeconds, durationSeconds }).catch(() => {});
        },
        [playing]
    );
    // Closing the player refreshes the list so cards show updated progress.
    const closePlayer = () => {
        setPlaying(null);
        load();
    };
    // Manual complete / incomplete — reversible.
    const markComplete = async (v) => {
        try {
            const p = await toggleVideoComplete(v._id, !v.progress?.completed);
            toast.success(p.completed ? "Marked complete" : "Marked as not done");
            load();
        } catch (e) {
            toast.error(e.message || "Couldn't update progress.");
        }
    };

    useEffect(() => {
        load();
        getExams()
            .then((e) => setExamList(e || []))
            .catch(() => setExamList([]));
    }, []);

    const examMap = useMemo(() => new Map((examList || []).map((e) => [e.code, e.name])), [examList]);

    // Exam codes actually present on the videos (specific targets), and every
    // subject in the library — used to decide whether the filter gate is worth it.
    const examOptions = useMemo(() => {
        const codes = new Set();
        for (const v of videos || []) for (const t of v.targets || []) if (t && t !== "all") codes.add(t);
        return [...codes];
    }, [videos]);
    const subjectsAll = useMemo(() => {
        const seen = [];
        for (const v of videos || []) {
            const s = v.subject?.trim() || "General";
            if (!seen.includes(s)) seen.push(s);
        }
        return seen;
    }, [videos]);

    // Worth gating only when there's something meaningful to filter by.
    const needsGate =
        !!videos?.length && (examOptions.length > 0 || subjectsAll.length > 1 || subjectsAll.some((s) => s !== "General"));
    const firstTime = videos !== null && filter === null && needsGate;
    const gateShown = firstTime || changeOpen;
    const effectiveFilter = filter || ALL_FILTER;

    const applyFilter = (f) => {
        setFilter(f);
        try {
            sessionStorage.setItem(FILTER_KEY, JSON.stringify(f));
        } catch {
            /* sessionStorage unavailable — keep it in memory */
        }
        setChangeOpen(false);
    };

    // Group the filtered videos by subject, clustering each subject's videos by
    // chapter so a subject reads top-to-bottom while filling a dense grid.
    const grouped = useMemo(() => {
        if (firstTime) return [];
        const bySubject = new Map();
        for (const v of videos || []) {
            if (!matchesFilter(v, effectiveFilter)) continue;
            const subj = v.subject?.trim() || "General";
            if (!bySubject.has(subj)) bySubject.set(subj, []);
            bySubject.get(subj).push(v);
        }
        for (const [, list] of bySubject)
            list.sort((a, b) => (a.chapter || "").localeCompare(b.chapter || "") || (a.order || 0) - (b.order || 0));
        return [...bySubject.entries()];
    }, [videos, effectiveFilter, firstTime]);

    const handleDelete = async (video) => {
        if (!window.confirm(`Delete "${video.title}"? Students will no longer see it.`)) return;
        setBusyId(video._id);
        try {
            await deleteVideo(video._id);
            setVideos((prev) => (prev || []).filter((v) => v._id !== video._id));
            toast.success("Video deleted");
        } catch (e) {
            toast.error(e.message || "Couldn't delete the video.");
        } finally {
            setBusyId(null);
        }
    };

    const handleSaved = () => load();

    const gridCls = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    const subjectSuggestions = subjectsAll.filter((s) => s !== "General");

    // Human-readable summary of the active filter for the summary bar.
    const filterSummary = [
        effectiveFilter.exam === "all" ? "All exams" : examMap.get(effectiveFilter.exam) || effectiveFilter.exam,
        effectiveFilter.subject === "all" ? "All subjects" : effectiveFilter.subject,
        effectiveFilter.chapter !== "all" ? effectiveFilter.chapter : null,
    ].filter(Boolean);

    return (
        <div className="mx-auto max-w-6xl">
            {/* Header — a refined, professional "studio" panel: a deep slate/indigo
                base with a subtle dot-grid texture, a soft glow, and a decorative
                equalizer motif (fitting for video), instead of a loud gradient. */}
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg ring-1 ring-white/10 sm:p-6">
                {/* dot-grid texture */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.12]" aria-hidden="true">
                    <defs>
                        <pattern id="vl-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#vl-dots)" />
                </svg>
                {/* soft glow */}
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                {/* equalizer / waveform motif */}
                <svg className="pointer-events-none absolute bottom-0 right-4 hidden text-indigo-400 sm:block" width="188" height="52" viewBox="0 0 188 52" fill="none" aria-hidden="true">
                    {[18, 30, 12, 40, 24, 46, 20, 34, 16, 38, 26, 44, 14, 32].map((h, i) => (
                        <rect key={i} x={i * 14} y={52 - h} width="6" height={h} rx="3" fill="currentColor" opacity={0.18 + (i % 3) * 0.1} />
                    ))}
                </svg>
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                            <MonitorPlay className="h-6 w-6 text-indigo-300" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Video Lectures</h1>
                            <p className="text-sm text-slate-300">
                                {videos?.length
                                    ? `${videos.length} curated ${videos.length === 1 ? "lecture" : "lectures"} · playing right here inside OneLeet`
                                    : "Curated lectures, playing right here inside OneLeet"}
                            </p>
                        </div>
                    </div>
                    {staff && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setBulkOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
                            >
                                <Layers size={16} /> Add multiple
                            </button>
                            <button
                                onClick={() => setEditing({ video: null })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
                            >
                                <Plus size={16} /> Add video
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Active-filter summary + change */}
            {!firstTime && needsGate && videos?.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Showing</span>
                        {filterSummary.map((part, i) => (
                            <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                                {part}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => setChangeOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    >
                        <SlidersHorizontal size={13} /> Change filters
                    </button>
                </div>
            )}

            {videos === null ? (
                <div className={gridCls}>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="aspect-video animate-pulse bg-slate-200" />
                            <div className="space-y-2 p-2.5">
                                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <MonitorPlay className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No videos yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {staff ? "Add your first lecture with the buttons above." : "Your mentors will publish video lectures here soon."}
                    </p>
                </div>
            ) : firstTime ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <SlidersHorizontal className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Choose your filters to see the lectures</p>
                    <p className="mt-0.5 text-xs text-slate-400">Pick your exam to get started.</p>
                </div>
            ) : grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ListFilter className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No videos match these filters</p>
                    <button
                        onClick={() => setChangeOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                        <SlidersHorizontal size={13} /> Change filters
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map(([subj, vids]) => (
                        <section key={subj}>
                            <div className="mb-3 flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">{subj}</h2>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{vids.length}</span>
                            </div>
                            <div className={gridCls}>
                                {vids.map((v) => (
                                    <div key={v._id} className={cn("h-full", busyId === v._id && "pointer-events-none opacity-50")}>
                                        <VideoCard
                                            video={v}
                                            staff={staff}
                                            onPlay={play}
                                            onEdit={(vid) => setEditing({ video: vid })}
                                            onDelete={handleDelete}
                                            onTogglePremium={togglePremium}
                                            onToggleComplete={markComplete}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {gateShown && (
                <VideoFilterGate
                    videos={videos || []}
                    examList={examList}
                    staff={staff}
                    initial={filter}
                    dismissable={!firstTime}
                    onApply={applyFilter}
                    onClose={() => setChangeOpen(false)}
                />
            )}

            {playing && (
                <PlayerModal
                    video={playing}
                    onClose={closePlayer}
                    onProgress={onProgress}
                    guarded={Boolean(playing.premium) && !staff}
                />
            )}
            <PremiumGateModal open={!!premiumGate} onClose={() => setPremiumGate(null)} itemTitle={premiumGate?.title} />
            {editing && (
                <VideoEditorModal
                    video={editing.video}
                    subjects={subjectSuggestions}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}
            {bulkOpen && (
                <BulkVideoModal subjects={subjectSuggestions} onClose={() => setBulkOpen(false)} onSaved={handleSaved} />
            )}
        </div>
    );
}
