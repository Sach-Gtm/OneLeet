import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardCheck,
    Target,
    Clock,
    TrendingUp,
    Loader2,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { listAttempts } from "@/Api/TestsApi";
import { getMyAnalytics } from "@/Api/ActivityApi";

const fmtTime = (min) => {
    const m = Math.max(0, Math.round(min || 0));
    const h = Math.floor(m / 60);
    return h ? `${h}h ${m % 60}m` : `${m}m`;
};

export default function Analytics() {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [time, setTime] = useState({ totalMinutes: 0, minutesByDay: [], topPages: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            listAttempts()
                .then((res) => res.attempts || [])
                .catch(() => []),
            getMyAnalytics().catch(() => ({ totalMinutes: 0, minutesByDay: [], topPages: [] })),
        ])
            .then(([atts, t]) => {
                setAttempts(atts);
                setTime(t);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    const stats = user?.stats || {};
    // API returns newest-first; show oldest→newest left→right in the chart.
    const chrono = [...attempts].reverse().slice(-12);
    const bestScorePct = attempts.reduce(
        (m, a) => (a.totalMarks ? Math.max(m, Math.round((a.score / a.totalMarks) * 100)) : m),
        0
    );

    const tiles = [
        { label: "Tests Taken", value: stats.testsTaken || 0, icon: ClipboardCheck, color: "text-indigo-600 bg-indigo-50" },
        { label: "Avg Accuracy", value: `${stats.accuracy || 0}%`, icon: Target, color: "text-emerald-600 bg-emerald-50" },
        { label: "Best Score", value: `${bestScorePct}%`, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
        { label: "Time on OneLeet", value: fmtTime(time.totalMinutes), icon: Clock, color: "text-violet-600 bg-violet-50" },
    ];

    // Last 14 days of time, oldest→newest, with any missing days shown as 0.
    const dayMap = new Map((time.minutesByDay || []).map((d) => [d.date, d.minutes]));
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        return { key, minutes: dayMap.get(key) || 0, label: d.toLocaleDateString(undefined, { day: "numeric" }) };
    });
    const maxDay = Math.max(1, ...days.map((d) => d.minutes));

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                <p className="text-sm text-slate-500">Track your accuracy and scores over time.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {tiles.map((t) => {
                    const Icon = t.icon;
                    return (
                        <div key={t.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                            <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", t.color)}>
                                <Icon size={18} />
                            </span>
                            <p className="mt-3 text-2xl font-bold text-slate-900">{t.value}</p>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">Time on OneLeet (last 14 days)</h2>
                    <span className="text-xs font-medium text-slate-400">{fmtTime(time.totalMinutes)} total</span>
                </div>
                {time.totalMinutes === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                        <Clock className="mb-2 h-7 w-7 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">No time tracked yet</p>
                        <p className="mt-0.5 text-xs text-slate-400">Your minutes across the app show up here as you study.</p>
                    </div>
                ) : (
                    <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Minutes per day">
                        {days.map((d) => (
                            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                                <div className="flex w-full flex-1 items-end">
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-500 transition-all"
                                        style={{ height: `${Math.max(3, (d.minutes / maxDay) * 100)}%` }}
                                        title={`${d.minutes} min`}
                                    />
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
                            </div>
                        ))}
                    </div>
                )}
                {time.topPages?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {time.topPages.slice(0, 5).map((p) => (
                            <span
                                key={p.path}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                            >
                                <span className="text-slate-400">{p.path === "/" ? "Home" : p.path.replace(/^\//, "")}</span>
                                <span className="font-semibold text-indigo-600">{fmtTime(p.minutes)}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold text-slate-800">Accuracy trend (recent tests)</h2>
                {chrono.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
                        <BarChart3 className="mb-2 h-7 w-7 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">No test data yet</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Take a <Link to="/tests" className="font-semibold text-indigo-600 hover:underline">mock test</Link> to start tracking.
                        </p>
                    </div>
                ) : (
                    <div className="flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label="Accuracy per recent test">
                        {chrono.map((a, i) => (
                            <div key={a._id || i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                <div className="relative flex w-full flex-1 items-end">
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-500 transition-all"
                                        style={{ height: `${Math.max(4, a.accuracy || 0)}%` }}
                                        title={`${a.testTitle}: ${a.accuracy}% (${a.score}/${a.totalMarks})`}
                                    />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500">{a.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {attempts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="mb-3 text-sm font-bold text-slate-800">Recent tests</h2>
                    <div className="divide-y divide-slate-100">
                        {attempts.slice(0, 8).map((a) => (
                            <div key={a._id} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{a.testTitle}</p>
                                    <p className="text-xs text-slate-400">{timeAgo(a.submittedAt)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-800">{a.score}/{a.totalMarks}</span>
                                    <span className="ml-2 text-xs text-slate-400">{a.accuracy}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
