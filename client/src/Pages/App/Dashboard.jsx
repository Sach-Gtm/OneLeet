import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardCheck,
    Target,
    CheckCircle2,
    Clock,
    Play,
    CalendarDays,
    Sparkles,
    Flame,
    Activity,
    BookOpen,
    Loader2,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getDashboard } from "@/Api/DashboardApi";

function PrepRing({ value = 0 }) {
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;
    return (
        <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 110 110">
                <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="9"
                />
                <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="url(#prepGradient)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
                <defs>
                    <linearGradient id="prepGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{value}%</span>
            </div>
        </div>
    );
}

const STAT_META = [
    { key: "testsTaken", label: "Tests Taken", icon: ClipboardCheck, color: "text-indigo-600 bg-indigo-50", format: (v) => v },
    { key: "accuracy", label: "Accuracy", icon: Target, color: "text-emerald-600 bg-emerald-50", format: (v) => `${v}%` },
    { key: "pyqsSolved", label: "PYQs Solved", icon: CheckCircle2, color: "text-amber-600 bg-amber-50", format: (v) => v.toLocaleString() },
    { key: "studyHours", label: "Study Hours", icon: Clock, color: "text-violet-600 bg-violet-50", format: (v) => `${v}h` },
];

function EmptyState({ icon, title, subtitle }) {
    const Icon = icon;
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
            <Icon className="mb-2 h-6 w-6 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getDashboard()
            .then((res) => {
                if (active) setData(res);
            })
            .catch(() => {
                if (active) setData(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const firstName = (user?.name || "there").split(" ")[0];
    const stats = data?.stats || {};
    const streak = stats.streak || 0;
    const recentActivity = data?.recentActivity || [];
    const continueLearning = data?.continueLearning || [];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Welcome + Overall Prep */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white lg:col-span-2">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <h1 className="text-2xl font-bold">
                        Welcome back, {firstName}! <span className="align-middle">👋</span>
                    </h1>
                    <p className="mt-1 max-w-md text-sm text-indigo-100">
                        {streak > 0
                            ? `You've maintained a ${streak}-day streak! Keep up the momentum to crack your dream college.`
                            : "Let's build your prep streak — start with a mock test or a set of PYQs today."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            to="/pyqs"
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                        >
                            <Play size={15} /> Start Practice
                        </Link>
                        <Link
                            to="/ai-tools"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            <CalendarDays size={15} /> Study Planner
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6">
                    <PrepRing value={stats.overallPrep || 0} />
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Overall Prep</p>
                        <p className="text-xs text-slate-400">Based on syllabus coverage</p>
                        {streak > 0 && (
                            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                                <Flame size={13} /> {streak}-day streak
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {STAT_META.map((meta) => {
                    const Icon = meta.icon;
                    const value = stats[meta.key] || 0;
                    return (
                        <div
                            key={meta.key}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <span
                                className={cn(
                                    "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                                    meta.color
                                )}
                            >
                                <Icon size={18} />
                            </span>
                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {meta.format(value)}
                            </p>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {meta.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* AI insight + Recent activity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 p-6 text-white lg:col-span-2">
                    <div className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                        <Sparkles size={13} /> AI Insight
                    </span>
                    <h2 className="mt-3 text-xl font-bold">
                        Personalised coaching, powered by AI
                    </h2>
                    <p className="mt-1 max-w-md text-sm text-slate-300">
                        Once you take a few mock tests, OneLeet&apos;s AI will pinpoint your
                        weak topics and curate a focused revision plan. Generate practice
                        questions and analyse your performance in AI Tools.
                    </p>
                    <Link
                        to="/ai-tools"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                        Explore AI Tools <ArrowRight size={15} />
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
                        <Activity size={16} className="text-slate-300" />
                    </div>
                    {recentActivity.length === 0 ? (
                        <EmptyState
                            icon={Activity}
                            title="No activity yet"
                            subtitle="Your tests, notes and PYQs will show up here."
                        />
                    ) : (
                        <ul className="space-y-3">
                            {recentActivity.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                                    <div>
                                        <p className="font-medium text-slate-700">{item.title}</p>
                                        <p className="text-xs text-slate-400">{item.time}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Continue learning */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold text-slate-800">Continue Learning</h2>
                {continueLearning.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Nothing in progress"
                        subtitle="Start a topic from PYQs or Notes and pick up where you left off."
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {continueLearning.map((item, i) => (
                            <div key={i} className="rounded-xl border border-slate-100 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                    {item.title}
                                </p>
                                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-500"
                                        style={{ width: `${item.progress || 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
