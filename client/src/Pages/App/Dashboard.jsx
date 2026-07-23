import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getDashboard } from "@/Api/DashboardApi";
import { getMyAnalytics } from "@/Api/ActivityApi";
import { getSyllabusSummary } from "@/Api/SyllabusApi";
import NetworkCanvas from "@/Components/General/NetworkCanvas";
import { isStudent } from "@/lib/roles";

// Counts up from 0 to `value` on mount (ease-out), so the stats feel alive.
function CountUp({ value = 0, format = (v) => v, duration = 1000 }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!value) return setN(0);
        let raf;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            setN(value * (1 - Math.pow(1 - t, 3)));
            if (t < 1) raf = requestAnimationFrame(tick);
            else setN(value);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return <>{format(Math.round(n))}</>;
}

// Circular prep gauge whose arc sweeps in on mount, in brand blue.
function PrepRing({ value = 0 }) {
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;
    return (
        <div className="relative h-28 w-28">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
                <motion.circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="url(#prepGradient)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                />
                <defs>
                    <linearGradient id="prepGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3FB0D6" />
                        <stop offset="100%" stopColor="#147a9e" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                    <CountUp value={value} format={(v) => `${v}%`} duration={1200} />
                </span>
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

// Real time-on-site over the last 7 days, drawn as bars that grow in.
function WeekActivity({ minutesByDay }) {
    const map = new Map((minutesByDay || []).map((d) => [d.date, d.minutes]));
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
            key,
            minutes: map.get(key) || 0,
            label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        };
    });
    const max = Math.max(1, ...days.map((d) => d.minutes));
    const total = days.reduce((s, d) => s + d.minutes, 0);
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">This week</h2>
                <span className="text-xs font-medium text-slate-400">
                    {total >= 60 ? `${Math.floor(total / 60)}h ${total % 60}m` : `${total}m`} studied
                </span>
            </div>
            <div className="flex h-24 items-end gap-2.5">
                {days.map((d, i) => (
                    <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full flex-1 items-end">
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                                style={{
                                    height: `${Math.max(4, (d.minutes / max) * 100)}%`,
                                    transformOrigin: "bottom",
                                }}
                                className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-500"
                                title={`${d.minutes} min`}
                            />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [week, setWeek] = useState([]);
    const [syllabus, setSyllabus] = useState(null);
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
        // Real time-on-site for the "this week" strip (best-effort).
        getMyAnalytics()
            .then((res) => active && setWeek(res.minutesByDay || []))
            .catch(() => {});
        // Syllabus coverage for the prep ring (best-effort).
        getSyllabusSummary()
            .then((res) => active && setSyllabus(res))
            .catch(() => {});
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

    const needsPhoto = user && isStudent(user) && !user?.passportPhoto?.url;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {needsPhoto && (
                <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
                >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                        <Camera size={18} />
                    </span>
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800">
                            Action required: upload your passport photo
                        </p>
                        <p className="text-amber-700">
                            A clear passport-size photo (under 1&nbsp;MB) is needed to complete
                            your profile. Tap to upload.
                        </p>
                    </div>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-amber-500" />
                </Link>
            )}

            {/* Welcome + Overall Prep */}
            <div className="grid gap-6 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white lg:col-span-2"
                >
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
                </motion.div>

                <Link
                    to="/syllabus"
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-md"
                >
                    <PrepRing value={syllabus?.totalTopics ? syllabus.percent : stats.overallPrep || 0} />
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Syllabus Coverage</p>
                        <p className="text-xs text-slate-400">
                            {syllabus?.totalTopics
                                ? `${syllabus.doneTopics}/${syllabus.totalTopics} topics done`
                                : "Track your syllabus topic-by-topic"}
                        </p>
                        {streak > 0 && (
                            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                                <Flame size={13} /> {streak}-day streak
                            </p>
                        )}
                    </div>
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {STAT_META.map((meta, idx) => {
                    const Icon = meta.icon;
                    const value = stats[meta.key] || 0;
                    return (
                        <motion.div
                            key={meta.key}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
                            className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
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
                                <CountUp value={value} format={meta.format} />
                            </p>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                {meta.label}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* This week — real time-on-site */}
            <WeekActivity minutesByDay={week} />

            {/* AI insight + Recent activity */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 p-6 text-white lg:col-span-2">
                    {/* living constellation backdrop */}
                    <NetworkCanvas className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
                    <div className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
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
