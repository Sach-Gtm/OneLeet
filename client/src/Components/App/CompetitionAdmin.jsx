import { useEffect, useState, useCallback } from "react";
import { Trophy, Download, RotateCcw, Loader2, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import { getAdminLeaderboards, exportAchievements, resetHallOfFame } from "@/Api/AdminApi";

// Admin view of competitive leaderboards + achievement data controls: see every
// scheduled test's board status, export achievements, and (super-admin) reset
// the whole Hall of Fame.
export default function CompetitionAdmin({ isSuper }) {
    const [rows, setRows] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        getAdminLeaderboards()
            .then(setRows)
            .catch(() => setRows([]));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const doExport = async () => {
        setBusy(true);
        try {
            await exportAchievements();
            toast.success("Downloading achievements CSV");
        } catch (e) {
            toast.error(e.message || "Export failed");
        } finally {
            setBusy(false);
        }
    };

    const doResetHoF = async () => {
        if (
            !window.confirm(
                "Reset the Hall of Fame? This permanently zeroes EVERY student's Rank 1/2/3 counters and cannot be undone."
            )
        )
            return;
        setBusy(true);
        try {
            const r = await resetHallOfFame();
            toast.success(r.message || "Hall of Fame reset");
        } catch (e) {
            toast.error(e.message || "Reset failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Trophy className="h-4 w-4 text-amber-500" /> Competition &amp; achievements
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                    <button
                        onClick={doExport}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                    {isSuper && (
                        <button
                            onClick={doResetHoF}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Hall of Fame
                        </button>
                    )}
                </div>
            </div>

            {rows === null ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                    No competitive tests yet. Set a close time on a test in the Content Studio to run one.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                <th className="py-2 font-semibold">Test</th>
                                <th className="font-semibold">Closes</th>
                                <th className="text-center font-semibold">Players</th>
                                <th className="text-right font-semibold">Leaderboard</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((t) => (
                                <tr key={t._id}>
                                    <td className="max-w-[220px] truncate py-2 pr-3 font-medium text-slate-700">
                                        {t.title}
                                    </td>
                                    <td className="whitespace-nowrap pr-3 text-slate-500">
                                        {t.closeAt ? new Date(t.closeAt).toLocaleString() : "—"}
                                    </td>
                                    <td className="text-center tabular-nums text-slate-500">{t.participants}</td>
                                    <td className="text-right">
                                        {t.published ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                <Unlock className="h-3 w-3" /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                                <Lock className="h-3 w-3" /> Locked
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
