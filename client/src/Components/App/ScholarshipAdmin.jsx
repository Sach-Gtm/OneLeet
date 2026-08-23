import { useEffect, useState, useCallback } from "react";
import { Trophy, Loader2, Download, RefreshCw, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { getScholarship, exportScholarship } from "@/Api/AdminApi";

// Admin-only: the All-India Scholarship Test registrations. These candidates are
// also auto-created as normal website accounts (they show in the student
// directory too), but this keeps the scholarship lead data on its own and lets
// staff download the full list as CSV / Excel.
export default function ScholarshipAdmin() {
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getScholarship();
            setRows(res?.registrations || []);
        } catch (err) {
            toast.error(err.message || "Couldn't load registrations");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const download = async () => {
        setDownloading(true);
        try {
            await exportScholarship();
        } catch (err) {
            toast.error(err.message || "Couldn't download the CSV");
        } finally {
            setDownloading(false);
        }
    };

    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Trophy className="h-4 w-4 text-amber-500" /> Scholarship Test registrations
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {rows ? rows.length : "…"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={load}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={download}
                        disabled={downloading || !rows?.length}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download CSV / Excel
                    </button>
                </div>
            </div>

            <p className="mb-3 text-xs text-slate-500">
                Everyone who registered for the All-India Scholarship Test. They&apos;re also added as
                normal candidates (they appear in the student directory), and this separate list can be
                exported to a spreadsheet.
            </p>

            {rows === null ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                    <Inbox className="h-6 w-6" />
                    No scholarship registrations yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2.5">Name</th>
                                <th className="px-3 py-2.5">Contact</th>
                                <th className="px-3 py-2.5">Diploma branch</th>
                                <th className="px-3 py-2.5">State</th>
                                <th className="px-3 py-2.5">Preparing for</th>
                                <th className="px-3 py-2.5 whitespace-nowrap">Registered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((r) => (
                                <tr key={r._id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2.5 font-semibold text-slate-800">{r.name || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        <div>
                                            {r.email ? (
                                                <a href={`mailto:${r.email}`} className="hover:text-indigo-600">{r.email}</a>
                                            ) : "-"}
                                        </div>
                                        {r.phone && (
                                            <a href={`tel:${r.phone}`} className="text-xs text-slate-400 hover:text-indigo-600">{r.phone}</a>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{r.diplomaBranch || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{r.state || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{r.preparingFor || "-"}</td>
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
