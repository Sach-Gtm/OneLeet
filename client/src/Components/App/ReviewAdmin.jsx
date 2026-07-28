import { useEffect, useState, useCallback } from "react";
import { Star, Loader2, Plus, Trash2, Quote, MonitorPlay } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getReviews, createReview, deleteReview } from "@/Api/ReviewsApi";
import { parseYouTubeId, youTubeThumb } from "@/lib/youtube";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const taCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

// Admin-only: manage the landing-page review strip. Add a written review or a
// YouTube video review (with a subject/title), or remove one. No dummy data —
// the strip only appears once a real review is added here.
export default function ReviewAdmin() {
    const [rows, setRows] = useState(null);
    const [type, setType] = useState("text");
    const [text, setText] = useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [url, setUrl] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        getReviews()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const vid = parseYouTubeId(url);
    const reset = () => {
        setText("");
        setTitle("");
        setAuthor("");
        setUrl("");
    };

    const add = async (e) => {
        e.preventDefault();
        if (type === "text" && !text.trim()) return toast.error("Write the review message.");
        if (type === "video") {
            if (!vid) return toast.error("Paste a valid YouTube link.");
            if (!title.trim()) return toast.error("Add a subject / title for the video.");
        }
        setBusy(true);
        try {
            await createReview({ type, text: text.trim(), title: title.trim(), author: author.trim(), url });
            toast.success("Review added — live on the landing page");
            reset();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't add");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (rv) => {
        if (!window.confirm("Remove this review from the landing page?")) return;
        try {
            await deleteReview(rv._id);
            toast.success("Removed");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Star className="h-4 w-4 text-amber-500" /> Landing-page reviews
                <span className="font-normal text-slate-400">— shown in the strip above the navbar</span>
            </div>

            {/* Text vs video */}
            <div className="mb-3 inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setType("text")}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                        type === "text"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                >
                    <Quote size={14} /> Text review
                </button>
                <button
                    type="button"
                    onClick={() => setType("video")}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                        type === "video"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                >
                    <MonitorPlay size={14} /> Video review
                </button>
            </div>

            <form onSubmit={add} className="mb-4 space-y-2">
                {type === "text" ? (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={2}
                        placeholder="What did the student say about OneLeet?"
                        className={taCls}
                    />
                ) : (
                    <>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="YouTube link (https://youtu.be/…)"
                            className={inCls}
                        />
                        {url &&
                            (vid ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                                    <img src={youTubeThumb(vid)} alt="" className="h-8 w-14 rounded object-cover" /> Valid link
                                </div>
                            ) : (
                                <p className="text-xs text-rose-500">That isn&apos;t a YouTube link yet.</p>
                            ))}
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Subject / title of the video"
                            className={inCls}
                        />
                    </>
                )}
                <div className="flex flex-wrap gap-2">
                    <input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Name / college (optional)"
                        className={cn(inCls, "min-w-0 flex-1")}
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add
                    </button>
                </div>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                    No reviews yet — add your first above.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((rv) => (
                        <li key={rv._id} className="flex items-center gap-3 py-2">
                            {rv.type === "video" ? (
                                <img
                                    src={youTubeThumb(rv.youtubeId)}
                                    alt=""
                                    className="h-9 w-16 shrink-0 rounded object-cover"
                                />
                            ) : (
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                                    <Quote size={15} />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                                    {rv.type === "video" ? rv.title : rv.text}
                                </p>
                                {rv.author && <p className="truncate text-xs text-slate-400">{rv.author}</p>}
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {rv.type}
                            </span>
                            <button
                                onClick={() => remove(rv)}
                                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                                aria-label="Delete review"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
