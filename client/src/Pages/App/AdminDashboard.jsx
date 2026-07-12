import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Users,
    Activity,
    Crown,
    ClipboardList,
    Target,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Send,
    UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    getAdminOverview,
    getStudents,
    setStudentPlan,
    setUserRole,
} from "@/Api/AdminApi";
import { sendNotification } from "@/Api/NotificationApi";

const STAT_CARDS = [
    { key: "totalStudents", label: "Total Students", icon: Users, tint: "text-indigo-600 bg-indigo-50" },
    { key: "activeToday", label: "Active Today", icon: Activity, tint: "text-emerald-600 bg-emerald-50" },
    { key: "premium", label: "Premium", icon: Crown, tint: "text-amber-600 bg-amber-50" },
    { key: "testsTaken", label: "Tests Taken", icon: ClipboardList, tint: "text-violet-600 bg-violet-50" },
    { key: "avgAccuracy", label: "Avg Accuracy", icon: Target, tint: "text-sky-600 bg-sky-50", suffix: "%" },
];

function StatCard({ icon: Icon, label, value, tint, suffix }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${tint}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <div className="text-2xl font-bold text-slate-900">
                        {value ?? 0}
                        {suffix || ""}
                    </div>
                    <div className="text-xs text-slate-500">{label}</div>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [data, setData] = useState({ students: [], total: 0, page: 1, pages: 1 });
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Send-notification form
    const [notif, setNotif] = useState({ title: "", body: "" });
    const [sending, setSending] = useState(false);
    // Team-access form
    const [team, setTeam] = useState({ email: "", role: "admin" });
    const [granting, setGranting] = useState(false);

    const isStaff = user && (user.role === "admin" || user.role === "teacher");
    const isAdmin = user && user.role === "admin";

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, list] = await Promise.all([
                getAdminOverview(),
                getStudents({ search, page, limit: 20 }),
            ]);
            setOverview(ov);
            setData(list);
        } catch (err) {
            toast.error(err.message || "Failed to load admin data");
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        if (isStaff) load();
    }, [isStaff, load]);

    // Hooks must run unconditionally; gate AFTER them.
    if (user && !isStaff) return <Navigate to="/dashboard" replace />;

    const togglePlan = async (student) => {
        const next = student.plan === "pro" ? "free" : "pro";
        try {
            await setStudentPlan(student._id, next);
            toast.success(next === "pro" ? "Moved to premium" : "Moved to free");
            setData((d) => ({
                ...d,
                students: d.students.map((s) =>
                    s._id === student._id ? { ...s, plan: next } : s
                ),
            }));
        } catch (err) {
            toast.error(err.message || "Could not update plan");
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!notif.title.trim() || !notif.body.trim()) {
            toast.error("Add a title and a message");
            return;
        }
        setSending(true);
        try {
            await sendNotification(notif);
            toast.success("Notification sent to everyone");
            setNotif({ title: "", body: "" });
        } catch (err) {
            toast.error(err.message || "Could not send");
        } finally {
            setSending(false);
        }
    };

    const handleGrant = async (e) => {
        e.preventDefault();
        if (!team.email.trim()) {
            toast.error("Enter the teammate's email");
            return;
        }
        setGranting(true);
        try {
            const res = await setUserRole(team.email.trim(), team.role);
            toast.success(res.message || "Access updated");
            setTeam({ email: "", role: "admin" });
        } catch (err) {
            toast.error(err.message || "Could not update access");
        } finally {
            setGranting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">
                    Everyone on OneLeet and how they&apos;re progressing.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {STAT_CARDS.map((c) => (
                    <StatCard
                        key={c.key}
                        icon={c.icon}
                        label={c.label}
                        value={overview?.[c.key]}
                        tint={c.tint}
                        suffix={c.suffix}
                    />
                ))}
            </div>

            {/* Actions: broadcast a notification + grant team access */}
            <div className="grid gap-4 lg:grid-cols-2">
                <form
                    onSubmit={handleSend}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Send className="h-4 w-4 text-indigo-600" /> Send a notification
                    </div>
                    <input
                        value={notif.title}
                        onChange={(e) => setNotif((n) => ({ ...n, title: e.target.value }))}
                        placeholder="Title (e.g. New mock test added!)"
                        maxLength={120}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <textarea
                        value={notif.body}
                        onChange={(e) => setNotif((n) => ({ ...n, body: e.target.value }))}
                        placeholder="Message shown in every student's notification bell..."
                        maxLength={1000}
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send to all
                    </button>
                </form>

                {isAdmin && (
                    <form
                        onSubmit={handleGrant}
                        className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <UserPlus className="h-4 w-4 text-amber-600" /> Team access
                        </div>
                        <p className="text-xs text-slate-500">
                            The teammate must register first, then enter their email
                            here to grant access.
                        </p>
                        <input
                            value={team.email}
                            onChange={(e) => setTeam((t) => ({ ...t, email: e.target.value }))}
                            placeholder="teammate@example.com"
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <div className="flex gap-2">
                            <select
                                value={team.role}
                                onChange={(e) => setTeam((t) => ({ ...t, role: e.target.value }))}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="admin">Admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="student">Student (revoke)</option>
                            </select>
                            <button
                                type="submit"
                                disabled={granting}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Update
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    placeholder="Search by name, email, or phone..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            {/* Students table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">College</th>
                                <th className="px-4 py-3 text-center">Tests</th>
                                <th className="px-4 py-3 text-center">Accuracy</th>
                                <th className="px-4 py-3 text-center">Plan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" />
                                    </td>
                                </tr>
                            ) : data.students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                data.students.map((s) => (
                                    <tr key={s._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {s.passportPhoto?.url || s.avatar ? (
                                                    <img
                                                        src={s.passportPhoto?.url || s.avatar}
                                                        alt={s.name}
                                                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                                        {(s.name || "U").charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-slate-800">
                                                        {s.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {new Date(s.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <div>{s.email}</div>
                                            <div className="text-xs text-slate-400">{s.phone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {s.college || "—"}
                                            {s.branch ? (
                                                <div className="text-xs text-slate-400">{s.branch}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {s.stats?.testsTaken ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-700">
                                            {s.stats?.accuracy ?? 0}%
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => togglePlan(s)}
                                                className={
                                                    s.plan === "pro"
                                                        ? "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                                                        : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                                                }
                                                title="Click to toggle premium"
                                            >
                                                {s.plan === "pro" ? (
                                                    <>
                                                        <Crown className="h-3 w-3" /> Premium
                                                    </>
                                                ) : (
                                                    "Free"
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                    <span>
                        {data.total} student{data.total === 1 ? "" : "s"}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="rounded-md border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span>
                            {data.page} / {data.pages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                            disabled={page >= data.pages}
                            className="rounded-md border border-slate-200 p-1.5 disabled:opacity-40 hover:bg-slate-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
