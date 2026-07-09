import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ClipboardList,
    Clock,
    ListChecks,
    Play,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { listTests, listAttempts } from "@/Api/TestsApi";

export default function TestsList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        Promise.all([listTests(), listAttempts().catch(() => ({ attempts: [] }))])
            .then(([t, a]) => {
                if (!active) return;
                setTests(t.tests || []);
                setAttempts(a.attempts || []);
            })
            .catch(() => active && setTests([]))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Mock Tests</h1>
                <p className="text-sm text-slate-500">
                    Timed, exam-style tests with instant scoring and a full breakdown.
                </p>
            </div>

            {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No tests available yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">Run the seed script or add a test to get started.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tests.map((t) => (
                        <div key={t._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                            {t.subject && (
                                <span className="mb-2 w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                                    {t.subject}
                                </span>
                            )}
                            <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                            {t.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>
                            )}
                            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <ListChecks size={14} /> {t.questionCount} Qs
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock size={14} /> {t.durationMinutes} min
                                </span>
                            </div>
                            <button
                                onClick={() => navigate(`/tests/${t._id}`)}
                                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                <Play size={15} /> Start Test
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {attempts.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-bold text-slate-800">Your recent attempts</h2>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {attempts.slice(0, 6).map((a) => (
                            <Link
                                key={a._id}
                                to={`/tests/result/${a._id}`}
                                className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50"
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{a.testTitle}</p>
                                    <p className="text-xs text-slate-400">
                                        Score {a.score}/{a.totalMarks} · {a.accuracy}% accuracy
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
