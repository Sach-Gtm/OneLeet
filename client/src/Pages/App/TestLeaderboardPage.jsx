import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import TestLeaderboardPanel from "@/Components/App/TestLeaderboardPanel";

// Standalone view of one test's leaderboard — the destination for the topper
// notification's deep link.
export default function TestLeaderboardPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft size={15} /> Back
            </button>
            <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-bold text-slate-900">Test leaderboard</h1>
            </div>
            <TestLeaderboardPanel testId={id} />
        </div>
    );
}
