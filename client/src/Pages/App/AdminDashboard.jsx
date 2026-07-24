import { useEffect, useState, useCallback, useRef } from "react";
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
    X,
    FileUp,
    ListChecks,
    Inbox,
    Bug,
    Gift,
    Phone,
    Paperclip,
    Trash2,
    Check,
    RefreshCw,
    ShieldCheck,
    UserX,
    LineChart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    getAdminOverview,
    getStudents,
    setStudentPlan,
    setUserRole,
    getStaff,
    removeUser,
} from "@/Api/AdminApi";
import StudentActivityModal from "@/Components/App/StudentActivityModal";
import CompetitionAdmin from "@/Components/App/CompetitionAdmin";
import AiUsageAdmin from "@/Components/App/AiUsageAdmin";
import BlocklistAdmin from "@/Components/App/BlocklistAdmin";
import ExamAdmin from "@/Components/App/ExamAdmin";
import { sendNotification } from "@/Api/NotificationApi";
import { uploadPyq } from "@/Api/PyqApi";
import { createQuestion, getQuestions } from "@/Api/QuestionApi";
import { getInbox, markInboxRead, deleteInboxItem } from "@/Api/ContactApi";
import { isStaff, isAdmin, isSuperadmin, roleLabel } from "@/lib/roles";

// Per-type presentation for the requests inbox.
const INBOX_TYPES = {
    bug: { label: "Bug", icon: Bug, tint: "text-rose-600 bg-rose-50 border-rose-200" },
    contribution: { label: "Contribution", icon: Gift, tint: "text-violet-600 bg-violet-50 border-violet-200" },
    callback: { label: "Callback", icon: Phone, tint: "text-emerald-600 bg-emerald-50 border-emerald-200" },
};

function timeAgo(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return "just now";
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
}

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
    // Team-access form (default to mentor — the role an admin is allowed to grant)
    const [team, setTeam] = useState({ email: "", role: "teacher" });
    const [granting, setGranting] = useState(false);
    // Full passport-photo viewer (admin identity check)
    const [photoView, setPhotoView] = useState(null);
    // PYQ paper upload (staff)
    const [pyqForm, setPyqForm] = useState({
        title: "",
        year: "",
        stateExam: "",
        subject: "",
        branch: "",
        topic: "",
        difficulty: "moderate",
        tag: "conceptual",
    });
    const [pyqFile, setPyqFile] = useState(null);
    const [uploadingPyq, setUploadingPyq] = useState(false);
    const pyqFileRef = useRef(null);
    // Add-a-question (staff)
    const [qForm, setQForm] = useState({ text: "", subject: "", topic: "", difficulty: "moderate", explanation: "" });
    const [qOptions, setQOptions] = useState(["", "", "", ""]);
    const [qCorrect, setQCorrect] = useState(0);
    const [qBusy, setQBusy] = useState(false);
    const [qCount, setQCount] = useState(null);
    // Requests inbox (bug reports / contributions / callbacks)
    const [inbox, setInbox] = useState({ items: [], unread: 0, counts: {}, total: 0 });
    const [inboxFilter, setInboxFilter] = useState("");
    const [inboxLoading, setInboxLoading] = useState(false);
    // Team roster (who is admin / mentor)
    const [staff, setStaff] = useState([]);
    // Per-student activity modal (which student's id is open)
    const [activityView, setActivityView] = useState(null);

    // Permission tiers (UI gate only — the API enforces the real rules):
    //   canCreate         — mentors + admins + super admin (content, notifs)
    //   canManageStudents — admins + super admin (student data, inbox, roster)
    //   isSuper           — super admin only (premium, removing staff)
    const canCreate = isStaff(user);
    const canManageStudents = isAdmin(user);
    const isSuper = isSuperadmin(user);

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
        if (canManageStudents) load();
    }, [canManageStudents, load]);

    useEffect(() => {
        if (!canCreate) return;
        getQuestions({ limit: 1 })
            .then((r) => setQCount(r.total ?? 0))
            .catch(() => {});
    }, [canCreate]);

    const loadStaff = useCallback(async () => {
        try {
            setStaff(await getStaff());
        } catch {
            /* non-critical — leave the roster empty */
        }
    }, []);

    useEffect(() => {
        if (canManageStudents) loadStaff();
    }, [canManageStudents, loadStaff]);

    const loadInbox = useCallback(async () => {
        setInboxLoading(true);
        try {
            const res = await getInbox({ type: inboxFilter, page: 1 });
            setInbox(res || { items: [], unread: 0, counts: {}, total: 0 });
        } catch (err) {
            toast.error(err.message || "Couldn't load requests");
        } finally {
            setInboxLoading(false);
        }
    }, [inboxFilter]);

    useEffect(() => {
        if (canManageStudents) loadInbox();
    }, [canManageStudents, loadInbox]);

    const toggleInboxRead = async (item) => {
        try {
            await markInboxRead(item._id, !item.read);
            loadInbox();
        } catch (err) {
            toast.error(err.message || "Couldn't update");
        }
    };

    const removeInboxItem = async (item) => {
        try {
            await deleteInboxItem(item._id);
            toast.success("Removed");
            loadInbox();
        } catch (err) {
            toast.error(err.message || "Couldn't remove");
        }
    };

    // Hooks must run unconditionally; gate AFTER them. Any staff (mentor,
    // admin, super admin) may open this page; each section is gated below.
    if (user && !canCreate) return <Navigate to="/dashboard" replace />;

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

    const handleRemove = async (target, kind) => {
        const who = kind === "staff" ? `${target.name} (${roleLabel(target)})` : target.name;
        const extra = kind === "student" ? " and their results" : "";
        if (
            !window.confirm(
                `Remove ${who}? This permanently deletes their account${extra} and blocks their email from signing up again. You can unblock it later under "Blocked accounts".`
            )
        )
            return;
        try {
            await removeUser(target._id);
            toast.success(`${target.name} has been removed`);
            if (kind === "staff") {
                loadStaff();
            } else {
                setData((d) => ({
                    ...d,
                    students: d.students.filter((s) => s._id !== target._id),
                    total: Math.max(0, d.total - 1),
                }));
            }
        } catch (err) {
            toast.error(err.message || "Could not remove the account");
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
            setTeam({ email: "", role: "teacher" });
            loadStaff();
        } catch (err) {
            toast.error(err.message || "Could not update access");
        } finally {
            setGranting(false);
        }
    };

    const setPyqField = (k) => (e) =>
        setPyqForm((f) => ({ ...f, [k]: e.target.value }));

    const handlePyqUpload = async (e) => {
        e.preventDefault();
        if (
            !pyqForm.title.trim() ||
            !pyqForm.year ||
            !pyqForm.stateExam.trim() ||
            !pyqForm.subject.trim()
        ) {
            toast.error("Title, year, exam and subject are required.");
            return;
        }
        if (pyqFile && pyqFile.size > 10 * 1024 * 1024) {
            toast.error("PDF must be 10 MB or smaller.");
            return;
        }
        setUploadingPyq(true);
        try {
            const fd = new FormData();
            Object.entries(pyqForm).forEach(([k, v]) => {
                if (v) fd.append(k, v);
            });
            if (pyqFile) fd.append("pdfFile", pyqFile);
            await uploadPyq(fd);
            toast.success("Paper added to the archive");
            setPyqForm({
                title: "",
                year: "",
                stateExam: "",
                subject: "",
                branch: "",
                topic: "",
                difficulty: "moderate",
                tag: "conceptual",
            });
            setPyqFile(null);
            if (pyqFileRef.current) pyqFileRef.current.value = "";
        } catch (err) {
            toast.error(err.message || "Could not upload the paper");
        } finally {
            setUploadingPyq(false);
        }
    };

    const setQField = (k) => (e) => setQForm((f) => ({ ...f, [k]: e.target.value }));
    const setOption = (i) => (e) =>
        setQOptions((opts) => opts.map((o, idx) => (idx === i ? e.target.value : o)));

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!qForm.text.trim()) return toast.error("Enter the question text.");
        const kept = [];
        let correct = -1;
        qOptions.forEach((o, i) => {
            const v = o.trim();
            if (v) {
                if (i === qCorrect) correct = kept.length;
                kept.push(v);
            }
        });
        if (kept.length < 2) return toast.error("Add at least 2 answer options.");
        if (correct < 0) return toast.error("The option you marked correct is empty.");
        setQBusy(true);
        try {
            await createQuestion({
                text: qForm.text,
                options: kept,
                correctIndex: correct,
                subject: qForm.subject,
                topic: qForm.topic,
                difficulty: qForm.difficulty,
                explanation: qForm.explanation,
            });
            toast.success("Question added to the bank");
            setQForm({ text: "", subject: "", topic: "", difficulty: "moderate", explanation: "" });
            setQOptions(["", "", "", ""]);
            setQCorrect(0);
            getQuestions({ limit: 1 })
                .then((r) => setQCount(r.total ?? 0))
                .catch(() => {});
        } catch (err) {
            toast.error(err.message);
        } finally {
            setQBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {canManageStudents ? "Admin Dashboard" : "Content Studio"}
                </h1>
                <p className="text-sm text-slate-500">
                    {canManageStudents
                        ? "Everyone on OneLeet and how they're progressing."
                        : "Create and publish learning material for students."}
                </p>
            </div>

            {/* Stats (admins + super admin) */}
            {canManageStudents && (
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
            )}

            {/* Requests inbox — every bug report, contribution & callback lands
                here. Admins + super admin only; mentors never see it. */}
            {canManageStudents && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Inbox className="h-4 w-4 text-indigo-600" /> Requests
                        {inbox.unread > 0 && (
                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                {inbox.unread} new
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={loadInbox}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${inboxLoading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                    {[
                        { key: "", label: "All", count: inbox.total },
                        { key: "bug", label: "Bugs", count: inbox.counts?.bug || 0 },
                        { key: "contribution", label: "Contributions", count: inbox.counts?.contribution || 0 },
                        { key: "callback", label: "Callbacks", count: inbox.counts?.callback || 0 },
                    ].map((f) => (
                        <button
                            key={f.key || "all"}
                            type="button"
                            onClick={() => setInboxFilter(f.key)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                inboxFilter === f.key
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {f.label}
                            {f.count ? ` · ${f.count}` : ""}
                        </button>
                    ))}
                </div>

                {inboxLoading && inbox.items.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    </div>
                ) : inbox.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                        No requests yet. Bug reports, contributions and callback requests
                        will show up here.
                    </div>
                ) : (
                    <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                        {inbox.items.map((it) => {
                            const meta = INBOX_TYPES[it.type] || INBOX_TYPES.bug;
                            const Icon = meta.icon;
                            return (
                                <li
                                    key={it._id}
                                    className={`rounded-lg border p-3 ${
                                        it.read
                                            ? "border-slate-200 bg-white"
                                            : "border-indigo-200 bg-indigo-50/40"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.tint}`}>
                                                    <Icon className="h-3 w-3" /> {meta.label}
                                                </span>
                                                {!it.read && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                                                <span className="text-xs text-slate-400">{timeAgo(it.createdAt)}</span>
                                            </div>
                                            <div className="mt-1.5 text-sm font-semibold text-slate-800">
                                                {it.name || "Anonymous"}
                                                {it.subject && (
                                                    <span className="ml-2 text-xs font-normal text-slate-500">· {it.subject}</span>
                                                )}
                                            </div>
                                            {(it.email || it.phone) && (
                                                <div className="text-xs text-slate-500">
                                                    {it.email && (
                                                        <a href={`mailto:${it.email}`} className="hover:text-indigo-600">{it.email}</a>
                                                    )}
                                                    {it.email && it.phone && " · "}
                                                    {it.phone && (
                                                        <a href={`tel:${it.phone}`} className="hover:text-indigo-600">{it.phone}</a>
                                                    )}
                                                </div>
                                            )}
                                            {it.message && (
                                                <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-600">{it.message}</p>
                                            )}
                                            {it.attachmentUrl && (
                                                <a
                                                    href={it.attachmentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    <Paperclip className="h-3 w-3" /> View attachment
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 flex-col gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => toggleInboxRead(it)}
                                                title={it.read ? "Mark as unread" : "Mark as read"}
                                                className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                                            >
                                                <Check className={`h-3.5 w-3.5 ${it.read ? "text-emerald-600" : ""}`} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeInboxItem(it)}
                                                title="Delete"
                                                className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            )}

            {/* Actions: broadcast a notification (any staff) + grant team access
                (admins + super admin) */}
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

                {canManageStudents && (
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
                            {!isSuper && " Admins can appoint mentors; only the Super Admin grants admin access."}
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
                                <option value="teacher">Mentor</option>
                                {isSuper && <option value="admin">Admin</option>}
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

            {/* Competitive leaderboards + achievement data (admins + super admin) */}
            {canManageStudents && <CompetitionAdmin isSuper={isSuper} />}

            {/* AI spend & usage dashboard (admins + super admin) */}
            {canManageStudents && <AiUsageAdmin />}

            {/* Universities / LEET catalog — add/remove colleges (admins + super admin) */}
            {canManageStudents && <ExamAdmin />}

            {/* Account block-list (super admin only) */}
            {isSuper && <BlocklistAdmin />}

            {/* Upload a PYQ paper (staff) */}
            <form
                onSubmit={handlePyqUpload}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileUp className="h-4 w-4 text-emerald-600" /> Upload a PYQ paper
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                        value={pyqForm.title}
                        onChange={setPyqField("title")}
                        placeholder="Title (e.g. IPU LEET 2024)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        type="number"
                        value={pyqForm.year}
                        onChange={setPyqField("year")}
                        placeholder="Year (e.g. 2024)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        value={pyqForm.stateExam}
                        onChange={setPyqField("stateExam")}
                        placeholder="Exam (e.g. IPU / All India)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        value={pyqForm.subject}
                        onChange={setPyqField("subject")}
                        placeholder="Subject (e.g. Mathematics)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        value={pyqForm.branch}
                        onChange={setPyqField("branch")}
                        placeholder="Branch (optional)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                        value={pyqForm.topic}
                        onChange={setPyqField("topic")}
                        placeholder="Topic (optional)"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <select
                        value={pyqForm.difficulty}
                        onChange={setPyqField("difficulty")}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select
                        value={pyqForm.tag}
                        onChange={setPyqField("tag")}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="conceptual">Conceptual</option>
                        <option value="numerical">Numerical</option>
                        <option value="theory">Theory</option>
                    </select>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        ref={pyqFileRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => setPyqFile(e.target.files?.[0] || null)}
                        className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                    />
                    <span className="text-xs text-slate-400">
                        PDF up to 10&nbsp;MB — students can view &amp; download it.
                    </span>
                    <button
                        type="submit"
                        disabled={uploadingPyq}
                        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {uploadingPyq ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileUp className="h-4 w-4" />
                        )}
                        Upload paper
                    </button>
                </div>
            </form>

            {/* Add a question (staff) */}
            <form onSubmit={handleAddQuestion} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <ListChecks className="h-4 w-4 text-indigo-600" /> Add a question
                    </div>
                    {qCount != null && (
                        <span className="text-xs font-medium text-slate-400">{qCount} in the bank</span>
                    )}
                </div>
                <textarea
                    value={qForm.text}
                    onChange={setQField("text")}
                    placeholder="Question text…"
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                    {qOptions.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                            <input
                                type="radio"
                                name="correct-option"
                                checked={qCorrect === i}
                                onChange={() => setQCorrect(i)}
                                className="h-4 w-4 shrink-0 text-indigo-600 focus:ring-indigo-500"
                                title="Mark as the correct answer"
                            />
                            <input
                                value={opt}
                                onChange={setOption(i)}
                                placeholder={`Option ${i + 1}`}
                                className="w-full bg-transparent text-sm focus:outline-none"
                            />
                        </label>
                    ))}
                </div>
                <p className="text-xs text-slate-400">Tick the circle next to the correct option.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <input value={qForm.subject} onChange={setQField("subject")} placeholder="Subject" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <input value={qForm.topic} onChange={setQField("topic")} placeholder="Topic (optional)" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    <select value={qForm.difficulty} onChange={setQField("difficulty")} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <textarea
                    value={qForm.explanation}
                    onChange={setQField("explanation")}
                    placeholder="Explanation (optional — shown after answering)"
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                    type="submit"
                    disabled={qBusy}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {qBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                    Add question
                </button>
            </form>

            {/* Student directory + roster — admins + super admin only */}
            {canManageStudents && (
            <>
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
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" />
                                    </td>
                                </tr>
                            ) : data.students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                data.students.map((s) => (
                                    <tr key={s._id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {s.passportPhoto?.url || s.avatar ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhotoView(s)}
                                                        title="View full photo"
                                                        className="shrink-0 rounded-full transition hover:ring-2 hover:ring-indigo-400"
                                                    >
                                                        <img
                                                            src={s.passportPhoto?.url || s.avatar}
                                                            alt={s.name}
                                                            className="h-9 w-9 rounded-full object-cover"
                                                        />
                                                    </button>
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
                                            {isSuper ? (
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
                                            ) : (
                                                <span
                                                    className={
                                                        s.plan === "pro"
                                                            ? "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                                            : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                                    }
                                                    title="Only the Super Admin can change premium"
                                                >
                                                    {s.plan === "pro" ? (
                                                        <>
                                                            <Crown className="h-3 w-3" /> Premium
                                                        </>
                                                    ) : (
                                                        "Free"
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => setActivityView(s._id)}
                                                    title="View activity"
                                                    className="inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <LineChart className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(s, "student")}
                                                    title="Remove this student"
                                                    className="inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            </div>
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

            {/* Team roster — who is admin & mentor. The Super Admin can remove
                mentors/admins here; admins see it read-only. */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Team
                    <span className="text-xs font-normal text-slate-400">
                        · {staff.length} member{staff.length === 1 ? "" : "s"}
                    </span>
                </div>
                {staff.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                        No mentors or admins yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {staff.map((m) => (
                            <li key={m._id} className="flex items-center gap-3 py-2.5">
                                {m.avatar ? (
                                    <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                        {(m.name || "U").charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-slate-800">{m.name}</div>
                                    <div className="truncate text-xs text-slate-400">{m.email}</div>
                                </div>
                                <span
                                    className={
                                        m.role === "superadmin"
                                            ? "rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
                                            : m.role === "admin"
                                              ? "rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                                              : "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                                    }
                                >
                                    {roleLabel(m)}
                                </span>
                                {isSuper && m.role !== "superadmin" && (
                                    <button
                                        onClick={() => handleRemove(m, "staff")}
                                        title={`Remove ${m.name}`}
                                        className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <UserX className="h-4 w-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            </>
            )}

            {/* Full passport-photo viewer (click a student's photo to verify identity) */}
            {photoView && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setPhotoView(null)}
                >
                    <div
                        className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPhotoView(null)}
                            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <img
                            src={photoView.passportPhoto?.url || photoView.avatar}
                            alt={photoView.name}
                            className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain"
                        />
                        <div className="mt-3 text-center">
                            <div className="font-semibold text-slate-800">
                                {photoView.name}
                            </div>
                            <div className="text-xs text-slate-400">{photoView.email}</div>
                        </div>
                    </div>
                </div>
            )}

            {activityView && (
                <StudentActivityModal
                    key={activityView}
                    studentId={activityView}
                    onClose={() => setActivityView(null)}
                />
            )}
        </div>
    );
}
