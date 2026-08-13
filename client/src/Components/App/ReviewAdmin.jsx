import { useEffect, useRef, useState, useCallback } from "react";
import { Star, Loader2, Plus, Trash2, Quote, MonitorPlay, Image as ImageIcon, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getReviews, createReview, deleteReview } from "@/Api/ReviewsApi";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const taCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_IMAGE = 8 * 1024 * 1024;

const TABS = [
    { key: "text", label: "Text review", icon: Quote },
    { key: "image", label: "Image review", icon: ImageIcon },
    { key: "video", label: "Video review", icon: MonitorPlay },
];

// Admin-only: manage the landing-page review marquee. Add a written review, an
// image (screenshot/photo) or a short video clip — all shown inline on the site
// at the same card size — or remove one. No dummy data: the section only appears
// once a real review exists.
export default function ReviewAdmin() {
    const [rows, setRows] = useState(null);
    const [type, setType] = useState("text");
    const [text, setText] = useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [file, setFile] = useState(null); // the image OR video File for this type
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);

    const load = useCallback(() => {
        getReviews().then(setRows).catch(() => setRows([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    const clearFile = () => {
        setFile(null);
        setPreview("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const pickFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const max = type === "video" ? MAX_VIDEO : MAX_IMAGE;
        if (f.size > max) {
            toast.error(type === "video" ? "Video must be 50 MB or smaller." : "Image must be 8 MB or smaller.");
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const switchType = (t) => {
        setType(t);
        clearFile(); // media doesn't carry across types
    };

    const reset = () => {
        setText("");
        setTitle("");
        setAuthor("");
        clearFile();
    };

    const add = async (e) => {
        e.preventDefault();
        if (type === "text" && !text.trim()) return toast.error("Write the review message.");
        if (type === "image" && !file) return toast.error("Choose an image to upload.");
        if (type === "video" && !file) return toast.error("Choose a video clip to upload.");
        setBusy(true);
        try {
            await createReview({
                type,
                text: text.trim(),
                title: title.trim(),
                author: author.trim(),
                image: type === "image" ? file : undefined,
                video: type === "video" ? file : undefined,
            });
            toast.success(type === "text" ? "Review added — live now" : `${type === "video" ? "Video" : "Image"} review uploaded — live now`);
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

    const rowIcon = (t) => (t === "video" ? MonitorPlay : t === "image" ? ImageIcon : Quote);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Star className="h-4 w-4 text-amber-500" /> Landing-page reviews
                <span className="font-normal text-slate-400">— a moving marquee near the bottom of the page</span>
            </div>

            {/* Text vs image vs video */}
            <div className="mb-3 inline-flex flex-wrap rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => switchType(t.key)}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                                type === t.key
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                        >
                            <Icon size={14} /> {t.label}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={add} className="mb-4 space-y-2">
                {type === "text" && (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={2}
                        placeholder="What did the student say about OneLeet?"
                        className={taCls}
                    />
                )}

                {type !== "text" && (
                    <>
                        {preview ? (
                            <div className="relative overflow-hidden rounded-lg bg-slate-900">
                                {type === "video" ? (
                                    <video src={preview} muted loop autoPlay playsInline className="h-40 w-full object-cover" />
                                ) : (
                                    <img src={preview} alt="" className="mx-auto h-40 object-contain" />
                                )}
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                                    aria-label="Remove file"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600"
                            >
                                <Upload size={18} />
                                {type === "video"
                                    ? "Upload a video clip (MP4/WebM, ≤50 MB)"
                                    : "Upload an image (JPG/PNG/WebP, ≤8 MB)"}
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept={type === "video" ? "video/*" : "image/*"}
                            onChange={pickFile}
                            className="hidden"
                        />
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Caption / title (optional)"
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
                        {busy && type !== "text" ? "Uploading…" : "Add"}
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
                    {rows.map((rv) => {
                        const Icon = rowIcon(rv.type);
                        return (
                            <li key={rv._id} className="flex items-center gap-3 py-2">
                                {rv.type === "image" && rv.image ? (
                                    <img src={rv.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                                ) : (
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                                        <Icon size={15} />
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                                        {rv.type === "text" ? rv.text : rv.title || `${rv.type === "video" ? "Video" : "Image"} review`}
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
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
