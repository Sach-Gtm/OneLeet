import { useEffect, useMemo, useState } from "react";
import { MonitorPlay, Play, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { isStaff as isStaffUser } from "@/lib/roles";
import { getVideos, deleteVideo } from "@/Api/VideosApi";
import { youTubeThumb, youTubeEmbed } from "@/lib/youtube";
import VideoEditorModal from "@/Components/App/VideoEditorModal";

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

function VideoCard({ video, staff, onPlay, onEdit, onDelete }) {
    const sub = [video.chapter, video.topic].filter(Boolean).join(" · ");
    return (
        <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-sm">
            <div className="relative aspect-video bg-slate-900">
                <button
                    onClick={() => onPlay(video)}
                    className="absolute inset-0 h-full w-full"
                    aria-label={`Play ${video.title}`}
                >
                    <img
                        src={youTubeThumb(video.youtubeId)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover opacity-95 transition group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/15 transition group-hover:bg-black/30">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-md transition group-hover:scale-110">
                            <Play className="h-5 w-5 translate-x-0.5 text-indigo-600" fill="currentColor" />
                        </span>
                    </span>
                </button>
                {!video.published && (
                    <span className="absolute left-2 top-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Draft
                    </span>
                )}
                {staff && (
                    <div className="absolute right-2 top-2 z-10 flex gap-1">
                        <button
                            onClick={() => onEdit(video)}
                            className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-indigo-600"
                            aria-label="Edit video"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => onDelete(video)}
                            className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-rose-500"
                            aria-label="Delete video"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>
            <button onClick={() => onPlay(video)} className="block w-full p-3 text-left">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{video.title}</p>
                {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">{video.author || "OneLeet"}</p>
            </button>
        </div>
    );
}

export default function Videos() {
    const { user } = useAuth();
    const staff = isStaffUser(user);

    const [videos, setVideos] = useState(null);
    const [subject, setSubject] = useState("all");
    const [playing, setPlaying] = useState(null);
    const [editing, setEditing] = useState(null); // { video } | { video: null } for new
    const [busyId, setBusyId] = useState(null);

    const load = () => getVideos().then(setVideos).catch(() => setVideos([]));
    useEffect(() => {
        load();
    }, []);

    // Distinct subjects (in the order the server returned them) for the filter.
    const subjects = useMemo(() => {
        const seen = [];
        for (const v of videos || []) {
            const s = v.subject?.trim() || "General";
            if (!seen.includes(s)) seen.push(s);
        }
        return seen;
    }, [videos]);

    // Group the (filtered) videos subject → chapter, preserving server order.
    const grouped = useMemo(() => {
        const bySubject = new Map();
        for (const v of videos || []) {
            const subj = v.subject?.trim() || "General";
            if (subject !== "all" && subj !== subject) continue;
            if (!bySubject.has(subj)) bySubject.set(subj, new Map());
            const chMap = bySubject.get(subj);
            const ch = v.chapter?.trim() || "";
            if (!chMap.has(ch)) chMap.set(ch, []);
            chMap.get(ch).push(v);
        }
        return [...bySubject.entries()];
    }, [videos, subject]);

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

    const handleSaved = () => {
        // Simplest correct path: refetch so grouping/order/visibility all reflect
        // the server's canonical state.
        load();
    };

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <MonitorPlay className="h-6 w-6 text-indigo-600" /> Video Lectures
                    </h1>
                    <p className="text-sm text-slate-500">
                        Curated lectures, chapter by chapter — playing right here inside OneLeet.
                    </p>
                </div>
                {staff && (
                    <button
                        onClick={() => setEditing({ video: null })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <Plus size={16} /> Add video
                    </button>
                )}
            </div>

            {/* Subject filter */}
            {subjects.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2">
                    <FilterChip active={subject === "all"} onClick={() => setSubject("all")}>
                        All
                    </FilterChip>
                    {subjects.map((s) => (
                        <FilterChip key={s} active={subject === s} onClick={() => setSubject(s)}>
                            {s}
                        </FilterChip>
                    ))}
                </div>
            )}

            {videos === null ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
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
            ) : (
                <div className="space-y-8">
                    {grouped.map(([subj, chapters]) => (
                        <section key={subj}>
                            <h2 className="mb-3 text-lg font-bold text-slate-900">{subj}</h2>
                            <div className="space-y-5">
                                {[...chapters.entries()].map(([ch, vids]) => (
                                    <div key={ch || "_"}>
                                        {ch && (
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                {ch}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {vids.map((v) => (
                                                <div key={v._id} className={cn(busyId === v._id && "opacity-50")}>
                                                    <VideoCard
                                                        video={v}
                                                        staff={staff}
                                                        onPlay={setPlaying}
                                                        onEdit={(vid) => setEditing({ video: vid })}
                                                        onDelete={handleDelete}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {playing && <PlayerModal video={playing} onClose={() => setPlaying(null)} />}
            {editing && (
                <VideoEditorModal
                    video={editing.video}
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
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-slate-800"
            )}
        >
            {children}
        </button>
    );
}
