import { useEffect, useState, useCallback } from "react";
import { Briefcase, Loader2, RefreshCw, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { adminListMbaRegistrations } from "@/Api/MbaApi";

// Admin-only: the OneLeet MBA batch registrations (which college each candidate
// picked before unlocking the Mock PI program). Its own list so staff can see
// exactly who registered and target follow-ups.
export default function MbaAdmin() {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await adminListMbaRegistrations();
            setRows(list || []);
        } catch (err) {
            toast.error(err.message || "Couldn't load MBA registrations");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Briefcase className="h-4 w-4 text-violet-500" /> OneLeet MBA registrations
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        {rows ? rows.length : "…"}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            <p className="mb-3 text-xs text-slate-500">
                Everyone who registered for the OneLeet MBA batch, with the college they picked.
            </p>

            {rows === null ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                    <Inbox className="h-6 w-6" />
                    No MBA registrations yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2.5">Name</th>
                                <th className="px-3 py-2.5">Contact</th>
                                <th className="px-3 py-2.5">College</th>
                                <th className="px-3 py-2.5 whitespace-nowrap">Registered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r._id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2.5 font-semibold text-slate-800">{r.name || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        <div>{r.email ? <a href={`mailto:${r.email}`} className="hover:text-indigo-600">{r.email}</a> : "-"}</div>
                                        {r.phone && <a href={`tel:${r.phone}`} className="text-xs text-slate-400 hover:text-indigo-600">{r.phone}</a>}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{r.college || "-"}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{fmtDate(r.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
