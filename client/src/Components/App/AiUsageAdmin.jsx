import { useEffect, useState } from "react";
import { Sparkles, Loader2, Database, Coins } from "lucide-react";
import { getAiUsage } from "@/Api/AdminApi";

// AI spend & usage dashboard for admins: how many generations ran, how many were
// served free from cache, and the estimated provider cost — today and this month.
const usd = (n) => `$${(n || 0).toFixed(4)}`;

function Stat({ label, value, tint }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-0.5 text-lg font-bold ${tint || "text-slate-900"}`}>{value}</p>
        </div>
    );
}

export default function AiUsageAdmin() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAiUsage()
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white py-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (!data) return null;

    const { today, month, byFeature = [], topUsers = [] } = data;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles className="h-4 w-4 text-indigo-600" /> AI spend &amp; usage
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Database className="h-3.5 w-3.5" /> {month.cacheHitRate}% served from cache this month
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Calls today" value={today.calls} />
                <Stat label="Est. cost today" value={usd(today.estCostUsd)} tint="text-indigo-700" />
                <Stat label="Calls this month" value={month.calls} />
                <Stat label="Est. cost / month" value={usd(month.estCostUsd)} tint="text-indigo-700" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Coins className="h-3.5 w-3.5" /> {month.billable} billable calls this month ({month.cached}{" "}
                free cache hits). Cost is an estimate on Gemini flash-lite pricing.
            </p>

            {byFeature.length > 0 && (
                <div className="mt-4">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        By feature (this month)
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                    <th className="py-1.5 font-semibold">Feature</th>
                                    <th className="text-right font-semibold">Calls</th>
                                    <th className="text-right font-semibold">Cached</th>
                                    <th className="text-right font-semibold">Est. cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {byFeature.map((f) => (
                                    <tr key={f.feature}>
                                        <td className="py-1.5 font-medium capitalize text-slate-700">
                                            {f.feature.replace(/-/g, " ")}
                                        </td>
                                        <td className="text-right tabular-nums text-slate-600">{f.calls}</td>
                                        <td className="text-right tabular-nums text-emerald-600">{f.cached}</td>
                                        <td className="text-right tabular-nums text-slate-600">{usd(f.estCostUsd)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {topUsers.length > 0 && (
                <div className="mt-4">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Heaviest users (this month, billable)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {topUsers.map((u) => (
                            <span
                                key={u.userId}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                            >
                                <span className="font-semibold text-slate-700">{u.name}</span>
                                {u.plan === "pro" && <span className="text-amber-600">★</span>}
                                <span className="text-slate-400">{u.calls} calls · {usd(u.estCostUsd)}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
