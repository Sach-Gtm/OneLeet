import { useEffect, useState } from "react";
import {
    X,
    Loader2,
    ClipboardCheck,
    Target,
    Clock,
    Flame,
    Sparkles,
    Crown,
} from "lucide-react";
import { getStudentActivity } from "@/Api/AdminApi";
import { timeAgo } from "@/lib/format";

const fmtTime = (min) => {
    const m = Math.max(0, Math.round(min || 0));
    const h = Math.floor(m / 60);
    return h ? `${h}h ${m % 60}m` : `${m}m`;
};

// Full read-only picture of one student for an admin: profile, tests, AI
// topics, and time spent. Opened from the student directory.
export default function StudentActivityModal({ studentId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getStudentActivity(studentId)
            .then((res) => active && setData(res))
            .catch((e) => active && setError(e.message || "Couldn't load this student"))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [studentId]);

    const s = data?.student;
    const time = data?.time || { totalMinutes: 0, minutesByDay: [] };
    const maxDay = Math.max(1, ...(time.minutesByDay || []).map((d) => d.minutes));

    const stats = [
        { label: "Tests", value: s?.stats?.testsTaken ?? 0, icon: ClipboardCheck, tint: "text-indigo-600 bg-indigo-50" },
        { label: "Accuracy", value: `${s?.stats?.accuracy ?? 0}%`, icon: Target, tint: "text-emerald-600 bg-emerald-50" },
        { label: "Time", value: fmtTime(time.totalMinutes), icon: Clock, tint: "text-violet-600 bg-violet-50" },
        { label: "Streak", value: `${s?.stats?.streak ?? 0}d`, icon: Flame, tint: "text-orange-600 bg-orange-50" },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-sm text-rose-600">{error}</div>
                ) : (
                    <div className="max-h-[85vh] overflow-y-auto p-6">
                        {/* Header */}
                        <div className="flex items-center gap-4 pr-8">
                            {s.passportPhoto?.url || s.avatar ? (
                                <img
                                    src={s.passportPhoto?.url || s.avatar}
                                    alt={s.name}
                                    className="h-14 w-14 rounded-full object-cover"
                                />
                            ) : (
                                <span className="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                                    {(s.name || "U").charAt(0).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-lg font-bold text-slate-900">{s.name}</h2>
                                    {s.plan === "pro" && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                            <Crown className="h-3 w-3" /> Premium
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-sm text-slate-500">{s.email}</p>
                                <p className="truncate text-xs text-slate-400">
                                    {[s.college, s.branch, s.yearOfStudy].filter(Boolean).join(" · ") || "No academic details"}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-5 grid grid-cols-4 gap-2">
                            {stats.map((st) => {
                                const Icon = st.icon;
                                return (
                                    <div key={st.label} className="rounded-xl border border-slate-200 p-3 text-center">
                                        <span className={`mx-auto grid h-8 w-8 place-items-center rounded-lg ${st.tint}`}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <p className="mt-1.5 text-base font-bold text-slate-900">{st.value}</p>
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{st.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time chart */}
                        {time.totalMinutes > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Time (last 14 days)</p>
                                <div className="flex h-20 items-end gap-1">
                                    {time.minutesByDay.map((d) => (
                                        <div
                                            key={d.date}
                                            className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-500"
                                            style={{ height: `${Math.max(4, (d.minutes / maxDay) * 100)}%` }}
                                            title={`${d.date}: ${d.minutes} min`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI topics */}
                        {data.ai?.topTopics?.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                    <Sparkles className="h-3.5 w-3.5" /> Searched on AI
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.ai.topTopics.map((t) => (
                                        <span key={t.topic} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            {t.topic}
                                            <span className="text-slate-400">×{t.count}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent tests */}
                        <div className="mt-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Recent tests</p>
                            {data.attempts?.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                                    No tests taken yet.
                                </p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {data.attempts.map((a) => (
                                        <div key={a._id} className="flex items-center justify-between py-2 text-sm">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-700">{a.testTitle}</p>
                                                <p className="text-xs text-slate-400">{timeAgo(a.submittedAt)}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className="font-bold text-slate-800">{a.score}/{a.totalMarks}</span>
                                                <span className="ml-2 text-xs text-slate-400">{a.accuracy}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
