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
    "No socials yet. We're too busy building. Go study! 📚",
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

// The StaplerLabs stapler mark (OneLeet's parent brand), drawn inline so it
// stays crisp and self-contained. The footer is an always-light island, so the
// body uses a fixed dark fill (matching the brand's near-black).
function StaplerLabsMark({ className = "" }) {
    return (
        <svg viewBox="4 6 44 33" className={className} fill="none" aria-hidden="true">
            {/* top arm — a wedge, tall on the right */}
            <path d="M8 22 L8 18 Q8 16.8 9.4 16.4 L40 8.4 Q44 7.3 44 11.4 L44 20 Q44 22 42 22 Z" className="fill-slate-800" />
            {/* bottom jaw */}
            <path d="M10 26 L42 26 Q45 26 45 28.5 Q45 31 42 31 L10 31 Q7 31 7 28.5 Q7 26 10 26 Z" className="fill-slate-800" />
            {/* staple */}
            <rect x="34" y="22.6" width="9" height="2.6" rx="1.3" className="fill-[#F5B70D]" />
            {/* base line */}
            <rect x="8" y="33.5" width="37" height="3.2" rx="1.6" className="fill-[#F5B70D]" />
        </svg>
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
        <footer className="mt-12 w-full bg-[#FAF9F6] text-slate-600">
            <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-slate-200 py-9 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
                {/* Brand + socials */}
                <div className="col-span-2 lg:col-span-1">
                    <Logo size={28} textClass="text-lg" />
                    <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-500">
                        Everything for the Lateral Entry Entrance Test: past papers, notes, smart practice and AI tools, in one place.
                    </p>
                    <div className="mt-4 flex items-center gap-2.5">
                        <a href="https://wa.me/919818549572" target="_blank" rel="noopener noreferrer" className={social + " hover:border-green-300 hover:text-green-500"} aria-label="WhatsApp"><MessageCircle size={15} /></a>
                        <a href="https://www.instagram.com/oneleet.in/" target="_blank" rel="noopener noreferrer" className={social + " hover:border-pink-300 hover:text-pink-500"} aria-label="Instagram"><Instagram size={15} /></a>
                        <button type="button" onClick={comingSoon} className={social + " hover:border-indigo-300 hover:text-indigo-600"} aria-label="LinkedIn"><Linkedin size={15} /></button>
                        <button type="button" onClick={comingSoon} className={social + " hover:border-sky-300 hover:text-sky-500"} aria-label="Twitter"><Twitter size={15} /></button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigate</h3>
                    <ul className="space-y-2.5 text-[13.5px]">
                        <li><Link to="/" className={linkCls}>Home</Link></li>
                        <li><Link to="/community" className={linkCls}>Community</Link></li>
                        <li><Link to="/mentor" className={linkCls}>Mentors</Link></li>
                        <li><Link to="/success" className={linkCls}>Success Stories</Link></li>
                        <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">LEET Prep</h3>
                    <ul className="space-y-2.5 text-[13.5px]">
                        <li><a href="/leet/" className={linkCls}>LEET Exam Guide</a></li>
                        <li><a href="/leet/previous-year-papers/" className={linkCls}>Previous Year Papers</a></li>
                        <li><a href="/leet/mock-tests/" className={linkCls}>Mock Tests</a></li>
                        <li><a href="/leet/syllabus/" className={linkCls}>Syllabus</a></li>
                        <li><a href="/leet/eligibility/" className={linkCls}>Eligibility</a></li>
                        <li><a href="/guides/" className={linkCls}>Prep Guides</a></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Resources</h3>
                    <ul className="space-y-2.5 text-[13.5px]">
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
                <p className="shrink-0">
                    &copy; {new Date().getFullYear()} OneLeet · A unit of{" "}
                    <a
                        href="https://staplerlabs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 align-middle font-semibold text-slate-600 transition-colors hover:text-slate-900"
                        title="StaplerLabs — visit staplerlabs.com"
                    >
                        <StaplerLabsMark className="h-4 w-auto" />
                        <span>Stapler<span className="text-[#F5B70D]">Labs</span></span>
                    </a>{" "}
                    Private Limited. All rights reserved.
                </p>
                <p className="sm:max-w-md sm:text-right">All study materials are provided solely for educational purposes; we don&apos;t claim ownership of external materials unless stated otherwise.</p>
            </div>
            </div>

            {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
        </footer>
    );
}
