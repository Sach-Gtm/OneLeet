import { useRef, useState } from "react";
import {
    Camera,
    Mail,
    Phone,
    GraduationCap,
    Building2,
    BookMarked,
    CalendarDays,
    Target,
    Save,
    Lock,
    Loader2,
    Award,
    Trophy,
    ClipboardCheck,
    CheckCircle2,
    Clock,
    ChevronDown,
    ShieldCheck,
    AlertTriangle,
    Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, changePassword, uploadPassportPhoto } from "@/Api/AuthApis";
import { missingProfileFields } from "@/lib/profile";
import { isStaff, roleLabel } from "@/lib/roles";

const MAX_PHOTO_BYTES = 1024 * 1024; // 1 MB

const inputCls =
    "h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function IconField({ icon, ...props }) {
    const Icon = icon;
    return (
        <div className="relative">
            <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={inputCls} {...props} />
        </div>
    );
}

export default function Profile() {
    const { user, setUser } = useAuth();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        targetExam: user?.targetExam || "",
        college: user?.college || "",
        branch: user?.branch || "",
        yearOfStudy: user?.yearOfStudy || "",
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [pwOpen, setPwOpen] = useState(false);
    const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [pwSaving, setPwSaving] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const staffUser = isStaff(user);
    const requiredKeys = staffUser
        ? ["name", "phone"]
        : ["name", "phone", "college", "branch", "yearOfStudy", "targetExam"];

    const save = async () => {
        const blanks = requiredKeys.filter((k) => !String(form[k] || "").trim());
        if (blanks.length) {
            toast.error("Please fill in all required fields.");
            return;
        }
        setSaving(true);
        try {
            const res = await updateProfile(form);
            setUser(res.user);
            toast.success("Profile saved");
        } catch (err) {
            toast.error(err.message || "Could not save profile");
        } finally {
            setSaving(false);
        }
    };

    const onPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Validate client-side for an instant, clear error. The server enforces
        // the same 1 MB limit and image-only rule.
        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file (JPG or PNG).");
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            toast.error("Photo must be 1 MB or smaller. Please compress it and try again.");
            if (fileRef.current) fileRef.current.value = "";
            return;
        }
        setUploading(true);
        try {
            const res = await uploadPassportPhoto(file);
            setUser(res.user);
            toast.success("Passport photo uploaded");
        } catch (err) {
            toast.error(err.message || "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const savePassword = async () => {
        if (pw.newPassword.length < 6) return toast.error("New password must be at least 6 characters.");
        if (pw.newPassword !== pw.confirm) return toast.error("New passwords don't match.");
        setPwSaving(true);
        try {
            await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
            toast.success("Password changed");
            setPw({ currentPassword: "", newPassword: "", confirm: "" });
            setPwOpen(false);
        } catch (err) {
            toast.error(err.message || "Could not change password");
        } finally {
            setPwSaving(false);
        }
    };

    const studentUser = !staffUser;
    const photoUrl = user?.passportPhoto?.url || user?.avatar || "";
    const missing = missingProfileFields(user);
    const incomplete = missing.length > 0;
    const req = <span className="text-red-500">*</span>;

    const stats = user?.stats || {};
    const overview = [
        { label: "Tests Taken", value: stats.testsTaken || 0, icon: ClipboardCheck, color: "text-indigo-600 bg-indigo-50" },
        { label: "PYQs Solved", value: (stats.pyqsSolved || 0).toLocaleString(), icon: CheckCircle2, color: "text-amber-600 bg-amber-50" },
        { label: "Study Hours", value: `${stats.studyHours || 0}h`, icon: Clock, color: "text-violet-600 bg-violet-50" },
        { label: "Accuracy", value: `${stats.accuracy || 0}%`, icon: Target, color: "text-emerald-600 bg-emerald-50" },
    ];
    const isTopScorer = (stats.accuracy || 0) >= 80 && (stats.testsTaken || 0) >= 1;
    const ach = user?.achievements || {};
    const totalPodiums = (ach.rank1 || 0) + (ach.rank2 || 0) + (ach.rank3 || 0);

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

            {incomplete && (
                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <div className="text-sm">
                        <p className="font-semibold text-amber-800">
                            Complete your profile to continue
                        </p>
                        <p className="text-amber-700">
                            All fields are required. Still needed:{" "}
                            <span className="font-semibold">
                                {missing.map((m) => m.label).join(", ")}
                            </span>
                            .
                        </p>
                    </div>
                    {missing.some((m) => m.key === "passportPhoto") && (
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 sm:ml-auto"
                        >
                            Upload photo
                        </button>
                    )}
                </div>
            )}

            {/* Header card */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
                <div className="relative">
                    {photoUrl ? (
                        <img src={photoUrl} alt={user?.name} className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                        <span className="grid h-20 w-20 place-items-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
                            {(user?.name || "U").charAt(0).toUpperCase()}
                        </span>
                    )}
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-indigo-600 text-white shadow hover:bg-indigo-700"
                        aria-label="Change photo"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                    <p className="text-sm text-slate-500">
                        {[user?.branch, user?.college].filter(Boolean).join(" · ") || "Add your academic details below"}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                        {user?.targetExam && (
                            <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-600">
                                Target: {user.targetExam}
                            </span>
                        )}
                        <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600">
                            {roleLabel(user)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: forms */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 text-sm font-bold text-slate-800">Personal Details</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name {req}</span>
                                <IconField icon={GraduationCap} value={form.name} onChange={set("name")} placeholder="Your name" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input className={cn(inputCls, "cursor-not-allowed bg-slate-50 text-slate-400")} value={user?.email || ""} readOnly />
                                </div>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone {req}</span>
                                <IconField icon={Phone} value={form.phone} onChange={set("phone")} placeholder="+91 …" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Target Exam {req}</span>
                                <IconField icon={Target} value={form.targetExam} onChange={set("targetExam")} placeholder="e.g. LEET 2026" />
                            </label>
                        </div>

                        <h3 className="mb-4 mt-6 text-sm font-bold text-slate-800">Academic Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">College Name {req}</span>
                                <IconField icon={Building2} value={form.college} onChange={set("college")} placeholder="Your college" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Branch / Stream {req}</span>
                                <IconField icon={BookMarked} value={form.branch} onChange={set("branch")} placeholder="e.g. Computer Engineering" />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Year of Study {req}</span>
                                <IconField icon={CalendarDays} value={form.yearOfStudy} onChange={set("yearOfStudy")} placeholder="e.g. Final Year" />
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => setPwOpen((v) => !v)}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800"
                            >
                                <Lock size={14} /> Change Password
                                <ChevronDown size={14} className={cn("transition-transform", pwOpen && "rotate-180")} />
                            </button>
                            <button
                                onClick={save}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                Save Changes
                            </button>
                        </div>

                        {pwOpen && (
                            <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
                                <input type="password" placeholder="Current password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                                <input type="password" placeholder="New password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                                <input type="password" placeholder="Confirm new" className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                                <div className="sm:col-span-3 flex justify-end">
                                    <button onClick={savePassword} disabled={pwSaving} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60">
                                        {pwSaving ? "Updating…" : "Update Password"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: overview + achievement */}
                <div className="space-y-6">
                    {studentUser && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-3 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-600" />
                                <h3 className="text-sm font-bold text-slate-800">Passport Photo</h3>
                                {user?.passportPhoto?.url ? (
                                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                        <CheckCircle2 size={12} /> Uploaded
                                    </span>
                                ) : (
                                    <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                                        Required
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-24 w-[72px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Passport" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center text-slate-300">
                                            <Camera size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">
                                    <p>Clear, front-facing photo on a plain background.</p>
                                    <p className="mt-1">
                                        JPG or PNG, <span className="font-semibold">max 1 MB</span>.
                                    </p>
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploading}
                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                    >
                                        {uploading ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                            <Upload size={13} />
                                        )}
                                        {user?.passportPhoto?.url ? "Replace photo" : "Upload photo"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 text-sm font-bold text-slate-800">Quick Overview</h3>
                        <div className="space-y-3">
                            {overview.map((o) => {
                                const Icon = o.icon;
                                return (
                                    <div key={o.label} className="flex items-center gap-3">
                                        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", o.color)}>
                                            <Icon size={16} />
                                        </span>
                                        <span className="text-sm text-slate-500">{o.label}</span>
                                        <span className="ml-auto text-sm font-bold text-slate-800">{o.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
                        <Award className="mb-2 h-6 w-6" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">Achievement</p>
                        <p className="mt-1 text-lg font-bold">{isTopScorer ? "Top 10% Scorer" : "Rising Star"}</p>
                        <p className="mt-1 text-sm text-indigo-100">
                            {isTopScorer
                                ? "You're consistently scoring above 80% in mock tests."
                                : "Take mock tests and keep your accuracy high to earn badges."}
                        </p>
                    </div>

                    {/* Competition achievements — permanent Top-3 finishes. */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                            <Trophy className="h-4 w-4 text-amber-500" /> Competition Achievements
                        </h3>
                        {totalPodiums === 0 ? (
                            <p className="text-sm text-slate-400">
                                No podium finishes yet. Finish in the Top 3 of a competitive test to
                                earn 🥇 🥈 🥉 badges.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    ["🥇", "Rank 1", ach.rank1],
                                    ["🥈", "Rank 2", ach.rank2],
                                    ["🥉", "Rank 3", ach.rank3],
                                ].map(([emoji, label, count]) => (
                                    <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="text-2xl leading-none">{emoji}</div>
                                        <div className="mt-1 text-lg font-extrabold text-slate-800">
                                            {count || 0}
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-400">{label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
