import { useEffect, useState, useCallback } from "react";
import { GraduationCap, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAdminExams, addExam, removeExam } from "@/Api/AdminApi";
import { clearExamsCache } from "@/Api/ExamsApi";

const GROUPS = [
    "Delhi NCR",
    "North India",
    "Central & West",
    "East & North-East",
    "South India",
    "Private / Deemed",
    "Other",
];

// Admin-only: manage the LEET exam / university catalog. Adds and removals are
// GLOBAL — every "target universities" picker and student filter reads this list.
export default function ExamAdmin() {
    const [rows, setRows] = useState(null);
    const [name, setName] = useState("");
    const [group, setGroup] = useState("Other");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        getAdminExams()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        try {
            await addExam(name.trim(), group);
            clearExamsCache();
            toast.success("College added — live everywhere");
            setName("");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't add");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (ex) => {
        if (!window.confirm(`Remove "${ex.name}"? It disappears from every targeting picker.`)) return;
        try {
            await removeExam(ex._id);
            clearExamsCache();
            toast.success("Removed");
            load();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    const grouped = {};
    for (const r of rows || []) {
        const g = r.group || "Other";
        (grouped[g] = grouped[g] || []).push(r);
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <GraduationCap className="h-4 w-4 text-indigo-500" /> Universities / LEET exams
                <span className="font-normal text-slate-400">— add or remove; applies everywhere</span>
            </div>

            <form onSubmit={add} className="mb-3 flex flex-wrap gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="College / LEET name (e.g. XYZ University LEET)"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 px-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                    {GROUPS.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                </button>
            </form>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                    No colleges yet — add your first above.
                </p>
            ) : (
                <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                    {Object.entries(grouped).map(([g, items]) => (
                        <div key={g}>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{g}</p>
                            <ul className="divide-y divide-slate-100">
                                {items.map((ex) => (
                                    <li key={ex._id} className="flex items-center gap-2 py-2">
                                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{ex.name}</span>
                                        <button
                                            onClick={() => remove(ex)}
                                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                            aria-label={`Remove ${ex.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
