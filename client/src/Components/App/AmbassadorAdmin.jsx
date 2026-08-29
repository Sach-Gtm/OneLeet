import { useEffect, useState, useCallback } from "react";
import { Megaphone, Loader2, Download, RefreshCw, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { getAmbassadors, exportAmbassadors, setAmbassadorStatus } from "@/Api/AdminApi";

const STATUS_CLS = {
    new: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    shortlisted: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};
const STATUSES = ["new", "shortlisted", "selected", "rejected"];

// Admin-only: Campus Ambassador Program applications. Staff can review, set a
// selection status per applicant, and export the full list as CSV / Excel.
export default function AmbassadorAdmin() {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAmbassadors();
            setRows(res?.applications || []);
        } catch (err) {
            toast.error(err.message || "Couldn't load applications");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const download = async () => {
        setDownloading(true);
        try { await exportAmbassadors(); }
        catch (err) { toast.error(err.message || "Couldn't download the CSV"); }
        finally { setDownloading(false); }
    };

    const changeStatus = async (id, status) => {
        setSaving(id);
        try {
            await setAmbassadorStatus(id, status);
            setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
        } catch (err) {
            toast.error(err.message || "Couldn't update status");
        } finally {
            setSaving("");
        }
    };

    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Megaphone className="h-4 w-4 text-indigo-500" /> Campus Ambassador applications
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{rows ? rows.length : "…"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button type="button" onClick={download} disabled={downloading || !rows?.length}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download CSV / Excel
                    </button>
                </div>
            </div>

            <p className="mb-3 text-xs text-slate-500">
                Everyone who applied to the Campus Ambassador Program. Set a status to run your selection, and export the
                full list to a spreadsheet.
            </p>

            {rows === null ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                    <Inbox className="h-6 w-6" /> No ambassador applications yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2.5">Name</th>
                                <th className="px-3 py-2.5">Contact</th>
                                <th className="px-3 py-2.5">College</th>
                                <th className="px-3 py-2.5">Social</th>
                                <th className="px-3 py-2.5">Why / Work</th>
                                <th className="px-3 py-2.5">Status</th>
                                <th className="px-3 py-2.5 whitespace-nowrap">Applied</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r._id} className="align-top hover:bg-slate-50">
                                    <td className="px-3 py-2.5 font-semibold text-slate-800">{r.name || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        {r.email && <div><a href={`mailto:${r.email}`} className="hover:text-indigo-600">{r.email}</a></div>}
                                        {r.phone && <a href={`tel:${r.phone}`} className="text-xs text-slate-400 hover:text-indigo-600">{r.phone}</a>}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        {r.college || "-"}{r.year ? <div className="text-xs text-slate-400">{r.year}</div> : null}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        {r.socialHandle || "-"}{r.socialReach ? <div className="text-xs text-slate-400">{r.socialReach}</div> : null}
                                    </td>
                                    <td className="max-w-[240px] px-3 py-2.5 text-xs text-slate-500">
                                        {r.whyJoin ? <p className="line-clamp-3" title={r.whyJoin}>{r.whyJoin}</p> : null}
                                        {r.work ? <p className="mt-1 text-slate-400" title={r.work}>Work: {r.work}</p> : null}
                                        {!r.whyJoin && !r.work ? "-" : null}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <select
                                            value={r.status || "new"}
                                            disabled={saving === r._id}
                                            onChange={(e) => changeStatus(r._id, e.target.value)}
                                            className={`rounded-md border-0 px-2 py-1 text-xs font-bold capitalize ${STATUS_CLS[r.status] || STATUS_CLS.new}`}
                                        >
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
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
