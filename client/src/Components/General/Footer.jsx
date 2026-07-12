import { Link } from "react-router-dom";
import {
    Mail,
    Bug,
    Instagram,
    Linkedin,
    MessageCircle,
    Twitter,
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-24 w-full border-t border-slate-200 bg-slate-50 text-slate-600">
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                        Get Connected With Us
                    </p>

                    <div className="flex items-center gap-6">
                        <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:scale-110 hover:text-green-500" aria-label="WhatsApp">
                            <MessageCircle size={20} />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:scale-110 hover:text-pink-500" aria-label="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:scale-110 hover:text-indigo-600" aria-label="LinkedIn">
                            <Linkedin size={20} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 transition-colors hover:scale-110 hover:text-sky-500" aria-label="Twitter">
                            <Twitter size={20} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 sm:gap-8 sm:py-16 lg:grid-cols-4">
                <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <span className="block h-8 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                        ONE{" "}
                        <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                            LEET
                        </span>
                    </h2>

                    <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                        Your one-stop platform for the Lateral Entry Entrance Test —
                        past papers, notes, smart practice and AI tools, all in one place.
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                        A unit of{" "}
                        <span className="font-semibold text-slate-700">
                            StaplerLabs Private Limited
                        </span>
                        .
                    </p>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-indigo-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Navigate
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Home</Link></li>
                        <li><Link to="/courses" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Courses</Link></li>
                        <li><Link to="/team" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Meet the Team</Link></li>
                        <li><Link to="/privacy" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Privacy Policy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-indigo-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Resources
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/join" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Join Community</Link></li>
                        <li><Link to="/contribute" className="text-slate-500 transition-all hover:pl-1 hover:text-indigo-600">Contribution Form</Link></li>
                        <li><Link to="/bug-report" className="flex items-center gap-2 text-slate-500 transition-all hover:pl-1 hover:text-red-500"><Bug size={14} /> Report a Bug</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-5 border-l-2 border-violet-500 pl-3 text-sm font-bold uppercase tracking-widest text-slate-900">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:admin@oneleet.in"
                            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
                                <Mail size={16} />
                            </div>
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">admin@oneleet.in</span>
                        </a>
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
        </footer>
    );
}
