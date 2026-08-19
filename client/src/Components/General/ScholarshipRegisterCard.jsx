import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Sparkles, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { SCHOLARSHIP_TEST_DATE } from "@/config/launch";
import { registerScholarship } from "@/Api/ScholarshipApi";
import { track } from "@/lib/telemetry";

// The states most of our diploma students write from (+ an "Other" catch-all).
const STATES = [
    "Delhi", "Uttar Pradesh", "Bihar", "Haryana", "Punjab", "Rajasthan",
    "Madhya Pradesh", "Maharashtra", "Gujarat", "Uttarakhand", "Jharkhand",
    "Chhattisgarh", "West Bengal", "Himachal Pradesh", "Jammu & Kashmir", "Other",
];
const EXAMS = [
    "IPU LEET (GGSIPU)", "DTU / NSUT LEET", "UP LEET (AKTU)", "Bihar LEET (BCECE-LE)",
    "Haryana LEET (HSTES)", "Gujarat LEET (ACPDC)", "SLIET LEET", "Not decided yet",
];

const field =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

// Self-contained registration card for the All-India Scholarship Test. Collects
// the candidate's details, posts them to the public endpoint (which also
// auto-creates/links a free OneLeet account), and shows a success state. Used
// both on the pre-launch /pricing countdown and on the standalone /scholarship
// registration page, so there is a single source of truth for the form.
export default function ScholarshipRegisterCard({ source = "web" }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", diplomaBranch: "", state: "", preparingFor: "" });
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) return toast.error("Please add your name and email.");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Please enter a valid email.");
        setBusy(true);
        try {
            const res = await registerScholarship({ ...form, source });
            track("scholarship_register");
            setDone(true);
            toast.success(res?.message || "You're registered!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30 dark:border-slate-700 dark:bg-slate-900">
            {/* Offer header — inline sRGB gradient (avoids the muddy OKLCH render). */}
            <div className="relative overflow-hidden px-6 pb-6 pt-6 text-center text-white" style={{ backgroundImage: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)" }}>
                <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <span className="pointer-events-none absolute -left-8 top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-white/25">
                    <Trophy className="h-3.5 w-3.5" /> All-India Scholarship Test
                </span>
                <h2 className="relative mt-3 text-2xl font-extrabold sm:text-3xl">
                    Register free · win up to <span className="rounded bg-amber-300 px-1.5 text-slate-900">100%</span> scholarship
                </h2>
                <p className="relative mx-auto mt-2 max-w-md text-sm text-white/90">
                    One common exam on <b>{SCHOLARSHIP_TEST_DATE}</b>. Rank high and get a ₹25,000 LEET course for just ₹499 — or completely FREE.
                </p>
            </div>

            {done ? (
                <div className="px-6 py-12 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                    <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">You&apos;re registered! 🎉</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                        Your seat for the All-India Scholarship Test on {SCHOLARSHIP_TEST_DATE} is booked. We&apos;ll email your joining link and hall-ticket. A free OneLeet account has been created with this email.
                    </p>
                    <Link to="/exams" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
                        Explore LEET exams &amp; cut-offs <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <form onSubmit={submit} className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
                    <input className={field} value={form.name} onChange={set("name")} placeholder="Full name *" autoComplete="name" />
                    <input className={field} value={form.email} onChange={set("email")} placeholder="Email *" type="email" autoComplete="email" />
                    <input className={field} value={form.phone} onChange={set("phone")} placeholder="Phone number" type="tel" inputMode="numeric" autoComplete="tel" />
                    <input className={field} value={form.diplomaBranch} onChange={set("diplomaBranch")} placeholder="Diploma branch (e.g. Computer Engg.)" />
                    <select className={`${field} ${form.state ? "" : "text-slate-400"}`} value={form.state} onChange={set("state")}>
                        <option value="">Your state</option>
                        {STATES.map((s) => <option key={s} value={s} className="text-slate-700">{s}</option>)}
                    </select>
                    <select className={`${field} ${form.preparingFor ? "" : "text-slate-400"}`} value={form.preparingFor} onChange={set("preparingFor")}>
                        <option value="">Preparing for</option>
                        {EXAMS.map((x) => <option key={x} value={x} className="text-slate-700">{x}</option>)}
                    </select>
                    <button
                        type="submit" disabled={busy}
                        className="col-span-1 mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:scale-[1.01] disabled:opacity-60 sm:col-span-2"
                        style={{ backgroundImage: "linear-gradient(90deg, #4f46e5, #7c3aed)" }}
                    >
                        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        Register free for the scholarship test
                    </button>
                    <p className="col-span-1 text-center text-[11px] text-slate-400 sm:col-span-2">
                        Free registration · Online mode · Registering also creates your free OneLeet account.
                    </p>
                </form>
            )}
        </div>
    );
}
