import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    Bug,
    Instagram,
    Linkedin,
    MessageCircle,
    Twitter,
    Phone,
    X,
    Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Logo from "@/Components/General/Logo";
import { submitCallback } from "@/Api/ContactApi";
import { CALLBACK_EVENT } from "@/lib/callback";

// No socials yet — clicking one drops a cheeky nudge instead of a dead link.
const FUNNY_LINES = [
    "No socials yet — we're too busy building. Go study! 📚",
    "Coming soon. For now, go crack some PYQs 😉",
    "Nothing here yet. Back to the mocks, champ! 💪",
    "Socials loading… meanwhile, one more mock test? 🚀",
];
const comingSoon = () =>
    toast(FUNNY_LINES[Math.floor(Math.random() * FUNNY_LINES.length)], { icon: "🔒" });

const linkCls = "text-slate-500 transition-all hover:pl-1 hover:text-indigo-600";

function CallbackModal({ onClose }) {
    const [form, setForm] = useState({ name: "", phone: "", reason: "" });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim())
            return toast.error("Please add your name and phone number.");
        setBusy(true);
        try {
            const res = await submitCallback(form);
            toast.success(res?.message || "We'll call you back soon!");
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const field =
        "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-4 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                        <Phone className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">Request a callback</h3>
                </div>
                <form onSubmit={submit} className="space-y-3">
                    <input className={field} value={form.name} onChange={set("name")} placeholder="Your name *" />
                    <input className={field} value={form.phone} onChange={set("phone")} placeholder="Phone number *" />
                    <textarea
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        rows={3}
                        value={form.reason}
                        onChange={set("reason")}
                        placeholder="What would you like to talk about? (optional)"
                    />
                    <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                        Request callback
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function Footer() {
    const [callbackOpen, setCallbackOpen] = useState(false);

    // Let any screen open the callback modal by firing CALLBACK_EVENT (see
    // lib/callback.js) — e.g. the dashboard's "Have more questions?" button.
    useEffect(() => {
        const open = () => setCallbackOpen(true);
        window.addEventListener(CALLBACK_EVENT, open);
        return () => window.removeEventListener(CALLBACK_EVENT, open);
    }, []);

    const social = "grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors";
    return (
        <footer className="mt-20 w-full bg-[#FAF9F6] text-slate-600">
            <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-slate-200 py-11 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
                {/* Brand + socials */}
                <div className="col-span-2 lg:col-span-1">
                    <Logo size={28} textClass="text-lg" />
                    <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-500">
                        Everything for the Lateral Entry Entrance Test — past papers, notes, smart practice and AI tools, in one place.
                    </p>
                    <div className="mt-4 flex items-center gap-2.5">
                        <button type="button" onClick={comingSoon} className={social + " hover:border-green-300 hover:text-green-500"} aria-label="WhatsApp"><MessageCircle size={15} /></button>
                        <button type="button" onClick={comingSoon} className={social + " hover:border-pink-300 hover:text-pink-500"} aria-label="Instagram"><Instagram size={15} /></button>
                        <button type="button" onClick={comingSoon} className={social + " hover:border-indigo-300 hover:text-indigo-600"} aria-label="LinkedIn"><Linkedin size={15} /></button>
                        <button type="button" onClick={comingSoon} className={social + " hover:border-sky-300 hover:text-sky-500"} aria-label="Twitter"><Twitter size={15} /></button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigate</h3>
                    <ul className="space-y-2.5 text-[13.5px]">
                        <li><Link to="/" className={linkCls}>Home</Link></li>
                        <li><Link to="/mentor" className={linkCls}>Mentors</Link></li>
                        <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Resources</h3>
                    <ul className="space-y-2.5 text-[13.5px]">
                        <li><Link to="/login" className={linkCls}>Join Community</Link></li>
                        <li><Link to="/contribute" className={linkCls}>Contribute a Paper</Link></li>
                        <li><Link to="/bug-report" className="inline-flex items-center gap-1.5 text-slate-500 transition-all hover:pl-1 hover:text-red-500"><Bug size={13} /> Report a Bug</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact</h3>
                    <div className="space-y-2 text-[13.5px]">
                        <a href="mailto:help@oneleet.in" className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-indigo-600">
                            <Mail size={14} className="text-slate-400" /> help@oneleet.in
                        </a>
                        <button type="button" onClick={() => setCallbackOpen(true)} className="flex items-center gap-2 text-slate-500 transition-colors hover:text-indigo-600">
                            <Phone size={14} className="text-slate-400" /> Request a callback
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-slate-200 py-5 text-[11.5px] leading-relaxed text-slate-400 sm:flex-row sm:items-start sm:justify-between">
                <p className="shrink-0">&copy; {new Date().getFullYear()} OneLeet · A unit of StaplerLabs Private Limited. All rights reserved.</p>
                <p className="sm:max-w-md sm:text-right">All study materials are provided solely for educational purposes; we don&apos;t claim ownership of external materials unless stated otherwise.</p>
            </div>
            </div>

            {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
        </footer>
    );
}
