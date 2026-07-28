import { useEffect, useRef, useState, useCallback } from "react";
import { Users, Loader2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getMentors, createMentor, deleteMentor } from "@/Api/MentorsApi";

const inCls =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const MAX_BYTES = 3 * 1024 * 1024;

// Admin-only: manage the public Mentors page — add a mentor (with an optional
// photo + description) or remove one.
export default function MentorAdmin() {
    const [rows, setRows] = useState(null);
    const [name, setName] = useState("");
    const [exam, setExam] = useState("");
    const [handle, setHandle] = useState("");
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const fileRef = useRef(null);

    const load = useCallback(() => {
        getMentors()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const pickPhoto = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > MAX_BYTES) {
            toast.error("Photo must be 3 MB or smaller.");
            return;
        }
        setPhoto(f);
        setPreview(URL.createObjectURL(f));
    };
    const clearPhoto = () => {
        setPhoto(null);
        setPreview("");
        if (fileRef.current) fileRef.current.value = "";
    };

    const reset = () => {
        setName("");
        setExam("");
        setHandle("");
        setDescription("");
        clearPhoto();
    };

    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Give the mentor a name.");
        setBusy(true);
        try {
            await createMentor({
                name: name.trim(),
                exam: exam.trim(),
                handle: handle.trim(),
                description: description.trim(),
                photo,
            });
            toast.success("Mentor added — live on the Mentors page");
            reset();
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't add");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (m) => {
        if (!window.confirm(`Remove "${m.name}" from the Mentors page?`)) return;
        try {
            await deleteMentor(m._id);
            toast.success("Removed");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Users className="h-4 w-4 text-indigo-500" /> Mentors
                <span className="font-normal text-slate-400">— shown on the public Mentors page</span>
            </div>

            <form onSubmit={add} className="mb-4 space-y-2">
                <div className="flex gap-3">
                    {/* Photo picker */}
                    <div className="shrink-0">
                        {preview ? (
                            <div className="relative">
                                <img src={preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
                                <button
                                    type="button"
                                    onClick={clearPhoto}
                                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-white"
                                    aria-label="Remove photo"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-600"
                                aria-label="Add photo"
                            >
                                <ImagePlus size={18} />
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inCls} />
                        <div className="flex gap-2">
                            <input value={exam} onChange={(e) => setExam(e.target.value)} placeholder="Cleared (e.g. IPU LEET 2024)" className={inCls} />
                            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle (optional)" className={inCls} />
                        </div>
                    </div>
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Anything you want to say about them (optional)"
                    className={cn(inCls, "h-auto py-2")}
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add mentor
                    </button>
                </div>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                    No mentors yet — add your first above.
                </p>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((m) => (
                        <li key={m._id} className="flex items-center gap-3 py-2">
                            {m.photo ? (
                                <img src={m.photo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                            ) : (
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-slate-800">
                                    {(m.name || "?").slice(0, 2).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{m.name}</p>
                                {m.exam && <p className="truncate text-xs text-slate-400">{m.exam}</p>}
                            </div>
                            <button
                                onClick={() => remove(m)}
                                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                                aria-label="Remove mentor"
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
