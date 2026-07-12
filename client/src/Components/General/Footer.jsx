import { useState } from "react";
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

    return (
        <footer className="mt-24 w-full border-t border-slate-200 bg-[#FAF9F6] text-slate-600">
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                        Get Connected With Us
                    </p>
                    <div className="flex items-center gap-6">
                        <button type="button" onClick={comingSoon} className="text-slate-400 transition-colors hover:scale-110 hover:text-green-500" aria-label="WhatsApp">
                            <MessageCircle size={20} />
                        </button>
                        <button type="button" onClick={comingSoon} className="text-slate-400 transition-colors hover:scale-110 hover:text-pink-500" aria-label="Instagram">
                            <Instagram size={20} />
                        </button>
                        <button type="button" onClick={comingSoon} className="text-slate-400 transition-colors hover:scale-110 hover:text-indigo-600" aria-label="LinkedIn">
                            <Linkedin size={20} />
                        </button>
                        <button type="button" onClick={comingSoon} className="text-slate-400 transition-colors hover:scale-110 hover:text-sky-500" aria-label="Twitter">
                            <Twitter size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 sm:gap-8 sm:py-16 lg:grid-cols-4">
                <div className="space-y-4">
                    <Logo size={34} textClass="text-2xl" />
                    <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                        Your one-stop platform for the Lateral Entry Entrance Test —
                        past papers, notes, smart practice and AI tools, all in one place.
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                        A unit of{" "}
                        <span className="font-semibold text-slate-700">StaplerLabs Private Limited</span>.
                    </p>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-indigo-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Navigate
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/" className={linkCls}>Home</Link></li>
                        <li><Link to="/mentor" className={linkCls}>Mentors</Link></li>
                        <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-indigo-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Resources
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/login" className={linkCls}>Join Community</Link></li>
                        <li><Link to="/contribute" className={linkCls}>Contribute a Paper</Link></li>
                        <li><Link to="/bug-report" className="flex items-center gap-2 text-slate-500 transition-all hover:pl-1 hover:text-red-500"><Bug size={14} /> Report a Bug</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-violet-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:help@oneleet.in"
                            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
                                <Mail size={16} />
                            </div>
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">help@oneleet.in</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setCallbackOpen(true)}
                            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110">
                                <Phone size={16} />
                            </div>
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Request a callback</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200 bg-white">
                <p className="mx-auto max-w-4xl px-6 py-6 text-center text-xs leading-relaxed text-slate-400">
                    &copy; {new Date().getFullYear()} OneLeet · A unit of StaplerLabs Private Limited. All rights reserved.
                    <br className="hidden sm:block" />
                    DISCLAIMER: All study materials on OneLeet are provided solely for educational
                    purposes. We do not claim ownership of any external materials unless stated otherwise.
                </p>
            </div>

            {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
        </footer>
    );
}
