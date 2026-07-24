import { useState } from "react";
import { X, Loader2, MonitorPlay, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import ExamMultiSelect from "@/Components/App/ExamMultiSelect";
import { createVideo, updateVideo } from "@/Api/VideosApi";
import { parseYouTubeId, youTubeThumb } from "@/lib/youtube";

const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

// Staff-only form to add or edit a video. Students never see this — the Videos
// page only mounts it for mentors/admins.
export default function VideoEditorModal({ video, onClose, onSaved }) {
    const isEdit = !!video;
    const [title, setTitle] = useState(video?.title || "");
    const [url, setUrl] = useState(video?.youtubeId ? `https://youtu.be/${video.youtubeId}` : "");
    const [subject, setSubject] = useState(video?.subject || "");
    const [chapter, setChapter] = useState(video?.chapter || "");
    const [topic, setTopic] = useState(video?.topic || "");
    const [author, setAuthor] = useState(video?.author && video.author !== "OneLeet" ? video.author : "");
    const [targets, setTargets] = useState(video?.targets || []);
    const [published, setPublished] = useState(video?.published !== false);
    const [busy, setBusy] = useState(false);

    const vid = parseYouTubeId(url);

    const save = async () => {
        if (!title.trim()) return toast.error("Give the video a title.");
        if (!vid) return toast.error("Paste a valid YouTube link.");
        if (!targets.length)
            return toast.error("Choose at least one university (or “All universities”).");
        setBusy(true);
        try {
            const payload = {
                title: title.trim(),
                url,
                subject: subject.trim(),
                chapter: chapter.trim(),
                topic: topic.trim(),
                author: author.trim(),
                targets,
                published,
            };
            const saved = isEdit ? await updateVideo(video._id, payload) : await createVideo(payload);
            toast.success(isEdit ? "Video updated" : "Video added");
            onSaved?.(saved);
            onClose?.();
        } catch (e) {
            toast.error(e.message || "Couldn't save the video.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <MonitorPlay size={16} />
                        </span>
                        <p className="text-sm font-bold text-slate-800">
                            {isEdit ? "Edit video" : "Add a video"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3 overflow-y-auto p-5">
                    <label className="block">
                        <span className={labelCls}>YouTube link</span>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=…"
                            className={inputCls}
                        />
                    </label>
                    {url &&
                        (vid ? (
                            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                <img
                                    src={youTubeThumb(vid)}
                                    alt=""
                                    className="h-12 w-20 shrink-0 rounded object-cover"
                                />
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle2 size={14} /> Valid — this plays inside OneLeet.
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-rose-500">
                                That doesn&apos;t look like a YouTube link yet.
                            </p>
                        ))}

                    <label className="block">
                        <span className={labelCls}>Title</span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Set Theory — Complete Concept"
                            className={inputCls}
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className={labelCls}>Subject</span>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Discrete Mathematics"
                                className={inputCls}
                            />
                        </label>
                        <label className="block">
                            <span className={labelCls}>Chapter / Unit</span>
                            <input
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                                placeholder="Unit 1 — Set Theory"
                                className={inputCls}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className={labelCls}>Topic (optional)</span>
                            <input
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Venn diagrams"
                                className={inputCls}
                            />
                        </label>
                        <label className="block">
                            <span className={labelCls}>Author (optional)</span>
                            <input
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Channel / teacher"
                                className={inputCls}
                            />
                        </label>
                    </div>

                    <div>
                        <span className={labelCls}>Target universities / LEET</span>
                        <ExamMultiSelect value={targets} onChange={setTargets} allowAll height="max-h-40" />
                        <p className="mt-1 text-[11px] text-slate-400">
                            Students see this only if it matches a university they&apos;re preparing for.
                            Pick “All universities” to show it to everyone.
                        </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Published (visible to students)
                    </label>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEdit ? "Save changes" : "Add video"}
                    </button>
                </div>
            </div>
        </div>
    );
}
