import { useEffect, useMemo, useState } from "react";
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
    GraduationCap,
    RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { isStaff as isStaffUser } from "@/lib/roles";
import { getVideos, deleteVideo, updateVideo } from "@/Api/VideosApi";
import { getExams } from "@/Api/ExamsApi";
import { youTubeThumb, youTubeEmbed } from "@/lib/youtube";
import PremiumBadge from "@/Components/General/PremiumBadge";
import PremiumGateModal from "@/Components/General/PremiumGateModal";
import VideoEditorModal from "@/Components/App/VideoEditorModal";

// A video with no targets (or ["all"]) is meant for every college, so it shows
// under any college filter as well as the "All colleges" view.
const isUniversalVideo = (v) => !v.targets?.length || v.targets.includes("all");
const videoInCollege = (v, college) =>
    college === "all" || isUniversalVideo(v) || (v.targets || []).includes(college);

// The in-site player: a YouTube embed in a branded modal so students watch
// inside OneLeet instead of being sent to youtube.com. Closes on Escape / click
// outside.
function PlayerModal({ video, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (!video) return null;
    const meta = [video.subject, video.chapter, video.topic].filter(Boolean).join(" · ");
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{video.title}</p>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-white/10"
                        aria-label="Close player"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="aspect-video w-full bg-black">
                    <iframe
                        src={`${youTubeEmbed(video.youtubeId)}&autoplay=1`}
                        title={video.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
                {(meta || video.description) && (
                    <div className="px-4 py-3">
                        {meta && <p className="text-xs font-medium text-slate-300">{meta}</p>}
                        {video.description && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{video.description}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact lecture card — small enough to show 4–5 per row on a laptop and 2 on a
// phone. Staff controls sit on the thumbnail and reveal on hover so the grid
// stays clean for students.
function VideoCard({ video, staff, onPlay, onEdit, onDelete, onTogglePremium }) {
    const locked = !!video.locked;
    const chapter = video.chapter?.trim();
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
            <div className="relative aspect-video overflow-hidden bg-slate-900">
                <button
                    onClick={() => onPlay(video)}
                    className="absolute inset-0 h-full w-full"
                    aria-label={locked ? `Unlock ${video.title}` : `Play ${video.title}`}
                >
                    {locked ? (
                        <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-800 to-slate-950">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-500/90 shadow-md transition group-hover:scale-110">
                                <Lock className="h-4 w-4 text-white" />
                            </span>
                        </span>
                    ) : (
                        <>
                            <img
                                src={youTubeThumb(video.youtubeId)}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
                                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md transition group-hover:scale-110">
                                    <Play className="h-4 w-4 translate-x-0.5 text-indigo-600" fill="currentColor" />
                                </span>
                            </span>
                        </>
                    )}
                </button>
                <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex gap-1">
                    {!video.published && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Draft
                        </span>
                    )}
                    {video.premium && <PremiumBadge locked={locked} />}
                </div>
                {staff && (
                    <div className="absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition duration-150 focus-within:opacity-100 group-hover:opacity-100">
                        <button
                            onClick={() => onTogglePremium(video)}
                            className={
                                "grid h-6 w-6 place-items-center rounded-md shadow-sm transition " +
                                (video.premium
                                    ? "bg-amber-500 text-white hover:bg-amber-600"
                                    : "bg-white/95 text-slate-600 hover:bg-white hover:text-amber-600")
                            }
                            aria-label={video.premium ? "Make free" : "Make premium"}
                            title={video.premium ? "Premium — click to make Free" : "Free — click to make Premium"}
                        >
                            <Crown size={12} />
                        </button>
                        <button
                            onClick={() => onEdit(video)}
                            className="grid h-6 w-6 place-items-center rounded-md bg-white/95 text-slate-600 shadow-sm hover:bg-white hover:text-indigo-600"
                            aria-label="Edit video"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={() => onDelete(video)}
                            className="grid h-6 w-6 place-items-center rounded-md bg-white/95 text-slate-600 shadow-sm hover:bg-white hover:text-rose-500"
                            aria-label="Delete video"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>
            <button onClick={() => onPlay(video)} className="flex flex-1 flex-col p-2.5 text-left">
                {chapter && (
                    <p className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                        {chapter}
                    </p>
                )}
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800">{video.title}</p>
                <p className="mt-auto pt-1 truncate text-[11px] text-slate-400">{video.author || "OneLeet"}</p>
            </button>
        </div>
    );
}

// One filter row: a label on the left and its chips on the right.
function FilterRow({ icon, label, children }) {
    return (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="flex shrink-0 items-center gap-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:w-36">
                {icon} {label}
            </span>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

export default function Videos() {
    const { user } = useAuth();
    const staff = isStaffUser(user);

    const [videos, setVideos] = useState(null);
    const [examList, setExamList] = useState([]);
    const [college, setCollege] = useState("all");
    const [subject, setSubject] = useState("all");
    const [playing, setPlaying] = useState(null);
    const [editing, setEditing] = useState(null); // { video } | { video: null } for new
    const [busyId, setBusyId] = useState(null);
    const [gate, setGate] = useState(null); // premium video a free student tapped

    const load = () => getVideos().then(setVideos).catch(() => setVideos([]));

    // A locked premium video routes to the upgrade prompt; otherwise it plays.
    const play = (v) => (v.locked ? setGate(v) : setPlaying(v));

    // Staff: flip a video free⇄premium in one click, then refetch.
    const togglePremium = async (video) => {
        try {
            await updateVideo(video._id, { premium: !video.premium });
            toast.success(video.premium ? "Now Free" : "Now Premium");
            load();
        } catch (e) {
            toast.error(e.message || "Couldn't update the video.");
        }
    };

    useEffect(() => {
        load();
        getExams()
            .then((e) => setExamList(e || []))
            .catch(() => setExamList([]));
    }, []);

    // Map a university code → its readable name for the college filter chips.
    const examMap = useMemo(() => new Map((examList || []).map((e) => [e.code, e.name])), [examList]);

    // Colleges present across the videos (specific targets only), ordered by the
    // exam catalog. These are exactly the universities staff targeted videos at.
    const colleges = useMemo(() => {
        const codes = new Set();
        for (const v of videos || [])
            for (const t of v.targets || []) if (t && t !== "all") codes.add(t);
        const order = new Map((examList || []).map((e, i) => [e.code, i]));
        return [...codes]
            .sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9))
            .map((code) => ({ code, name: examMap.get(code) || code }));
    }, [videos, examList, examMap]);

    // Only worth showing a college filter once videos are aimed at specific
    // colleges (videos meant for everyone don't need one).
    const showCollegeFilter = colleges.length >= 1;

    // Subjects available within the chosen college — so the second filter narrows
    // to what's actually there. Whatever staff named the subject becomes a chip.
    const subjects = useMemo(() => {
        const seen = [];
        for (const v of videos || []) {
            if (!videoInCollege(v, college)) continue;
            const s = v.subject?.trim() || "General";
            if (!seen.includes(s)) seen.push(s);
        }
        return seen;
    }, [videos, college]);

    const showSubjectFilter = subjects.length > 1 || subjects.some((s) => s !== "General");

    // Keep the selected subject valid when the college changes or its videos go.
    useEffect(() => {
        if (subject !== "all" && !subjects.includes(subject)) setSubject("all");
    }, [subjects, subject]);

    // Keep the selected college valid if its videos disappear.
    useEffect(() => {
        if (college !== "all" && videos && !colleges.some((c) => c.code === college)) setCollege("all");
    }, [colleges, college, videos]);

    const clearFilters = () => {
        setCollege("all");
        setSubject("all");
    };

    // Group the (filtered) videos by subject, clustering each subject's videos by
    // chapter so a subject reads top-to-bottom while still filling a dense grid.
    const grouped = useMemo(() => {
        const bySubject = new Map();
        for (const v of videos || []) {
            if (!videoInCollege(v, college)) continue;
            const subj = v.subject?.trim() || "General";
            if (subject !== "all" && subj !== subject) continue;
            if (!bySubject.has(subj)) bySubject.set(subj, []);
            bySubject.get(subj).push(v);
        }
        for (const [, list] of bySubject)
            list.sort(
                (a, b) =>
                    (a.chapter || "").localeCompare(b.chapter || "") || (a.order || 0) - (b.order || 0)
            );
        return [...bySubject.entries()];
    }, [videos, college, subject]);

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

    // Simplest correct path: refetch so grouping/order/visibility all reflect the
    // server's canonical state.
    const handleSaved = () => load();

    const gridCls = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

    return (
        <div className="mx-auto max-w-6xl">
            {/* Impressive gradient header */}
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg sm:p-6">
                <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-14 right-28 h-36 w-36 rounded-full bg-fuchsia-300/20 blur-2xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                            <MonitorPlay className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Video Lectures</h1>
                            <p className="text-sm text-white/80">
                                {videos?.length
                                    ? `${videos.length} curated ${videos.length === 1 ? "lecture" : "lectures"} · playing right here inside OneLeet`
                                    : "Curated lectures, playing right here inside OneLeet"}
                            </p>
                        </div>
                    </div>
                    {staff && (
                        <button
                            onClick={() => setEditing({ video: null })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                        >
                            <Plus size={16} /> Add video
                        </button>
                    )}
                </div>
            </div>

            {/* Two-level filter: college first, then subject. */}
            {(showCollegeFilter || showSubjectFilter) && (
                <div className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white/60 p-3.5">
                    {showCollegeFilter && (
                        <FilterRow icon={<GraduationCap size={13} />} label="College">
                            <FilterChip active={college === "all"} onClick={() => setCollege("all")}>
                                All colleges
                            </FilterChip>
                            {colleges.map((c) => (
                                <FilterChip
                                    key={c.code}
                                    active={college === c.code}
                                    onClick={() => setCollege(c.code)}
                                >
                                    {c.name}
                                </FilterChip>
                            ))}
                        </FilterRow>
                    )}
                    {showSubjectFilter && (
                        <FilterRow icon={<ListFilter size={13} />} label="Subject">
                            <FilterChip active={subject === "all"} onClick={() => setSubject("all")}>
                                All
                            </FilterChip>
                            {subjects.map((s) => (
                                <FilterChip key={s} active={subject === s} onClick={() => setSubject(s)}>
                                    {s}
                                </FilterChip>
                            ))}
                        </FilterRow>
                    )}
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
                        {staff
                            ? "Add your first lecture with the “Add video” button above."
                            : "Your mentors will publish video lectures here soon."}
                    </p>
                </div>
            ) : grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ListFilter className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No videos match these filters</p>
                    <button
                        onClick={clearFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                        <RotateCcw size={13} /> Clear filters
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map(([subj, vids]) => (
                        <section key={subj}>
                            <div className="mb-3 flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">{subj}</h2>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                    {vids.length}
                                </span>
                            </div>
                            <div className={gridCls}>
                                {vids.map((v) => (
                                    <div key={v._id} className={cn(busyId === v._id && "pointer-events-none opacity-50")}>
                                        <VideoCard
                                            video={v}
                                            staff={staff}
                                            onPlay={play}
                                            onEdit={(vid) => setEditing({ video: vid })}
                                            onDelete={handleDelete}
                                            onTogglePremium={togglePremium}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {playing && <PlayerModal video={playing} onClose={() => setPlaying(null)} />}
            <PremiumGateModal open={!!gate} onClose={() => setGate(null)} itemTitle={gate?.title} />
            {editing && (
                <VideoEditorModal
                    video={editing.video}
                    subjects={subjects.filter((s) => s !== "General")}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

function FilterChip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition",
                active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-800"
            )}
        >
            {children}
        </button>
    );
}
