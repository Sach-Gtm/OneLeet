import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { getSecurityAlerts } from "@/Api/AdminApi";

// Short human labels for each detected attempt type.
const TYPE_LABEL = {
    screenshot: "Screenshot",
    copy: "Copy",
    print: "Print / PDF",
    save: "Save page",
    "context-menu": "Right-click",
    devtools: "Dev tools",
    "tab-hidden": "Left tab (recording?)",
    download: "Download",
};

const WINDOWS = [
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
];

function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

// Admin panel: who has been attempting to capture / exfiltrate PREMIUM content.
// A browser can't truly block OS screenshots or screen recording, so premium
// content is watermarked with each student's identity and every DETECTABLE
// attempt is logged — this is where staff review it and decide who to reach out
// to. Rolled up per student so the "who" leads.
export default function ContentProtectionAdmin() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch whenever the window changes. State is only set inside async callbacks
    // here (never synchronously) so this effect can't cascade renders.
    useEffect(() => {
        let alive = true;
        getSecurityAlerts(days)
            .then((res) => alive && setData(res || { students: [], alerts: [] }))
            .catch(() => alive && setData({ students: [], alerts: [] }))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [days]);

    // Setting `loading` from a user event (not an effect) is fine.
    const pickDays = (d) => {
        if (d === days) return;
        setLoading(true);
        setDays(d);
    };
    const refresh = () => {
        setLoading(true);
        getSecurityAlerts(days)
            .then((res) => setData(res || { students: [], alerts: [] }))
            .catch(() => setData({ students: [], alerts: [] }))
            .finally(() => setLoading(false));
    };

    const students = data?.students || [];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Content protection alerts
                <span className="font-normal text-slate-400">
                    — attempts to capture premium content
                </span>
                <button
                    onClick={refresh}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                    title="Refresh"
                >
                    <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} /> Refresh
                </button>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-slate-400">
                Screenshots and screen recording can&apos;t be fully blocked in a browser, so every
                premium page is watermarked with the student&apos;s name &amp; contact — any leak is
                traceable. Detected attempts are listed here so you can gently ask the student to stop.
            </p>

            <div className="mb-3 flex gap-1.5">
                {WINDOWS.map((w) => (
                    <button
                        key={w.days}
                        onClick={() => pickDays(w.days)}
                        className={
                            "rounded-lg px-2.5 py-1 text-xs font-semibold transition " +
                            (days === w.days
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 text-slate-500 hover:bg-slate-50")
                        }
                    >
                        {w.label}
                    </button>
                ))}
            </div>

            {data === null || loading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
            ) : students.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                    No capture attempts on premium content in this window. 🎉
                </p>
            ) : (
                <ul className="space-y-2.5">
                    {students.map((s) => (
                        <li
                            key={s.user}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {s.name || "Unknown student"}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                        {s.email || s.phone || "—"}
                                    </p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                    {s.total} attempt{s.total === 1 ? "" : "s"}
                                </span>
                                <span className="text-xs text-slate-400">{timeAgo(s.lastAt)}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {Object.entries(s.types || {})
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([type, n]) => (
                                        <span
                                            key={type}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                                        >
                                            {TYPE_LABEL[type] || type}
                                            <span className="font-bold text-slate-400">×{n}</span>
                                        </span>
                                    ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
