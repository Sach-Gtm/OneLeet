import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { getErrorLogs } from "@/Api/AdminApi";

// System Health panel (audit C3): recent client + server errors captured by our
// own telemetry, so the founder can see what's breaking in production instead of
// launching blind. Collapsed by default; expands to a filterable recent list.
function timeAgo(d) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function AdminErrorPanel() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [source, setSource] = useState("");
    const [data, setData] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setData(await getErrorLogs({ source, limit: 100 }));
        } catch {
            setData({ errors: [], last24h: { client: 0, server: 0 } });
        } finally {
            setLoading(false);
        }
    }, [source]);

    // Load the 24h counts up front (cheap) so the header badge is meaningful even
    // while collapsed; reload the list when opened or the filter changes.
    useEffect(() => {
        load();
    }, [load]);

    const last24h = data?.last24h || { client: 0, server: 0 };
    const total24 = last24h.client + last24h.server;
    const errors = data?.errors || [];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
                <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                        total24 > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                    }`}
                >
                    <AlertTriangle size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">System health</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {total24 === 0
                            ? "No errors in the last 24 hours"
                            : `${total24} error${total24 === 1 ? "" : "s"} in 24h · ${last24h.server} server · ${last24h.client} client`}
                    </p>
                </div>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="mb-3 flex items-center gap-2">
                        {["", "server", "client"].map((s) => (
                            <button
                                key={s || "all"}
                                onClick={() => setSource(s)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
                                    source === s
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                            >
                                {s || "all"}
                            </button>
                        ))}
                        <button
                            onClick={load}
                            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                    ) : errors.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">Nothing captured. All quiet.</p>
                    ) : (
                        <div className="max-h-96 space-y-2 overflow-y-auto">
                            {errors.map((e) => (
                                <div
                                    key={e._id}
                                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                                e.source === "server"
                                                    ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15"
                                            }`}
                                        >
                                            {e.source}
                                        </span>
                                        {e.statusCode ? (
                                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {e.method || ""} {e.statusCode}
                                            </span>
                                        ) : null}
                                        <span className="ml-auto text-[11px] text-slate-400">{timeAgo(e.createdAt)}</span>
                                    </div>
                                    <p className="mt-1.5 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                                        {e.message || "(no message)"}
                                    </p>
                                    {e.url && (
                                        <p className="mt-0.5 truncate text-[11px] text-slate-400">{e.url}</p>
                                    )}
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        {e.user ? `${e.user.name || e.user.email}` : "anonymous"}
                                    </p>
                                    {e.stack && (
                                        <details className="mt-1">
                                            <summary className="cursor-pointer text-[11px] font-semibold text-indigo-600">
                                                stack
                                            </summary>
                                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-[10px] leading-relaxed text-slate-200">
                                                {e.stack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
