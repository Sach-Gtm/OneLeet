import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/Api/LeaderboardApi";

function RankBadge({ rank }) {
    if (rank <= 3) {
        const color = rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-orange-400";
        return <Medal className={cn("h-5 w-5", color)} />;
    }
    return <span className="text-sm font-semibold text-slate-400">#{rank}</span>;
}

function Row({ entry, highlight }) {
    return (
        <div
            className={cn(
                "grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[48px_1fr_80px_120px]",
                highlight && "bg-indigo-50/70"
            )}
        >
            <div className="flex justify-center">
                <RankBadge rank={entry.rank} />
            </div>
            <div className="flex min-w-0 items-center gap-3">
                {entry.avatar ? (
                    <img src={entry.avatar} alt={entry.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {(entry.name || "S").charAt(0).toUpperCase()}
                    </span>
                )}
                <span className={cn("truncate text-sm", highlight ? "font-bold text-indigo-700" : "font-medium text-slate-700")}>
                    {entry.name}
                    {entry.isCurrentUser && <span className="ml-1 text-indigo-500">(You)</span>}
                </span>
            </div>
            <div className="hidden text-right text-sm text-slate-400 sm:block">{entry.tests} tests</div>
            <div className="text-right">
                <span className="text-sm font-bold text-slate-800">{entry.totalScore}</span>
                <span className="text-xs text-slate-400">/{entry.totalMarks}</span>
            </div>
        </div>
    );
}

export default function Leaderboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard()
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    const board = data?.leaderboard || [];
    const me = data?.me;

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6 text-center">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-500">
                    <Trophy className="h-6 w-6" />
                </span>
                <h1 className="text-2xl font-bold text-slate-900">Top Performers This Week</h1>
                <p className="text-sm text-slate-500">Compete with the best minds across India.</p>
            </div>

            {board.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <Award className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No scores yet this week</p>
                    <p className="mt-0.5 text-xs text-slate-400">Take a mock test to get on the board.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="grid grid-cols-[40px_1fr_auto] gap-3 border-b border-slate-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:grid-cols-[48px_1fr_80px_120px]">
                            <span className="text-center">Rank</span>
                            <span>Student</span>
                            <span className="hidden text-right sm:block">Tests</span>
                            <span className="text-right">Score</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {board.map((entry) => (
                                <Row key={entry.userId} entry={entry} highlight={entry.isCurrentUser} />
                            ))}
                        </div>
                    </div>

                    {me && !me.inTop && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-200 bg-white">
                            <p className="border-b border-slate-100 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Your position
                            </p>
                            <Row
                                entry={{
                                    rank: me.rank,
                                    name: "You",
                                    isCurrentUser: true,
                                    tests: me.tests,
                                    totalScore: me.totalScore,
                                    totalMarks: me.totalMarks,
                                }}
                                highlight
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
