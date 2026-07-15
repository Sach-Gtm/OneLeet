import { useEffect, useState, useCallback } from "react";
import { Trophy, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTestLeaderboard } from "@/Api/LeaderboardApi";
import { Celebration, Encourage } from "@/Components/App/Celebration";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

function fmtCountdown(ms) {
    const total = Math.ceil(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Competitive leaderboard section for the result page. Shows a locked countdown
// while the board is frozen, then the final ranking + a celebration (Top 3) or
// an encouraging note once it publishes. Renders nothing for non-competitive
// tests (those keep the plain result page + the global weekly board).
export default function TestLeaderboardPanel({ testId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => Date.now());

    const load = useCallback(() => {
        if (!testId) return Promise.resolve();
        return getTestLeaderboard(testId)
            .then((res) => setData(res))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [testId]);

    useEffect(() => {
        load();
    }, [load]);

    // Tick the countdown while frozen.
    const pending = data?.status === "pending";
    useEffect(() => {
        if (!pending) return undefined;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [pending]);

    const revealMs = pending && data?.revealAt ? Math.max(0, new Date(data.revealAt).getTime() - now) : 0;

    // When the countdown hits zero, the board is due — refetch so the backend
    // finalises it lazily and we flip to the published view.
    useEffect(() => {
        if (pending && data?.revealAt && revealMs === 0) {
            const t = setTimeout(load, 3000);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [pending, data, revealMs, load]);

    if (loading || !data) return null;
    // Only competitive (scheduled graded) tests get the frozen board + celebration.
    if (!data.competitive) return null;

    if (data.status === "pending") {
        return (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
                <div className="flex items-center gap-2 text-indigo-700">
                    <Lock size={17} />
                    <h2 className="text-sm font-bold">Leaderboard locked</h2>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                    Your result is saved. To keep the competition fair, the leaderboard for this
                    test stays hidden until <strong>5 minutes after it closes</strong>.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">
                    <Clock size={15} />
                    {revealMs > 0 ? (
                        <span>
                            Leaderboard opens in <span className="tabular-nums">{fmtCountdown(revealMs)}</span>
                        </span>
                    ) : (
                        <span>Finalising the leaderboard…</span>
                    )}
                </div>
            </div>
        );
    }

    // Published.
    const me = data.me || { attempted: false };
    return (
        <div className="space-y-4">
            {me.attempted &&
                (me.isTop3 ? (
                    <Celebration rank={me.rank} timesAtRank={me.timesAtRank} />
                ) : (
                    <Encourage rank={me.rank} total={me.total} />
                ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    <h2 className="text-sm font-bold text-slate-800">Final leaderboard</h2>
                    <span className="ml-auto text-xs text-slate-400">
                        {data.total} participant{data.total === 1 ? "" : "s"}
                    </span>
                </div>
                <ul className="space-y-1.5">
                    {data.leaderboard.map((r) => (
                        <li
                            key={r.userId}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                                r.isCurrentUser ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-slate-50"
                            )}
                        >
                            <span className="grid w-7 shrink-0 place-items-center text-sm font-bold text-slate-500">
                                {MEDAL[r.rank] || r.rank}
                            </span>
                            {r.avatar ? (
                                <img src={r.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                    {(r.name || "S").charAt(0).toUpperCase()}
                                </span>
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                                {r.name}
                                {r.isCurrentUser && <span className="text-indigo-600"> (You)</span>}
                            </span>
                            <span className="shrink-0 tabular-nums font-semibold text-slate-700">
                                {r.score}
                                <span className="text-slate-400">/{r.totalMarks}</span>
                            </span>
                        </li>
                    ))}
                </ul>
                {me.attempted && me.rank > data.leaderboard.length && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm ring-1 ring-indigo-200">
                        <span className="grid w-7 shrink-0 place-items-center text-sm font-bold text-indigo-600">
                            {me.rank}
                        </span>
                        <span className="flex-1 font-medium text-slate-800">You</span>
                        <span className="shrink-0 tabular-nums font-semibold text-slate-700">
                            {me.score}
                            <span className="text-slate-400">/{me.totalMarks}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
