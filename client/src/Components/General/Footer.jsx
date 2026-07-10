import React from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    Bug,
    Instagram,
    Linkedin,
    MessageCircle,
    Twitter
} from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full text-gray-300 bg-black/40 backdrop-blur-xl border-t border-white/10 mt-24">

            <div className="border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="uppercase tracking-widest text-xs font-semibold text-indigo-400">
                        Get Connected With Us
                    </p>

                    <div className="flex items-center gap-6">
                        <a
                            href="https://whatsapp.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-green-400 transition-colors transform hover:scale-110"
                            aria-label="WhatsApp"
                        >
                            <MessageCircle size={20} />
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-pink-500 transition-colors transform hover:scale-110"
                            aria-label="Instagram"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-indigo-500 transition-colors transform hover:scale-110"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={20} />
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-sky-400 transition-colors transform hover:scale-110"
                            aria-label="Twitter"
                        >
                            <Twitter size={20} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full block"></span>
                        ONE{" "}
                        <span className="bg-gradient-to-r from-indigo-300 to-indigo-500 bg-clip-text text-transparent">
                            LEET
                        </span>
                    </h2>

                    <p className="text-gray-400 leading-relaxed text-sm max-w-xs">
                        Your one-stop destination for LEET learning.
                        PYQs, Notes, Smart Practice, AI Tools — all in one futuristic platform.
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5 border-l-2 border-indigo-500 pl-3">
                        Navigate
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li>
                            <Link to="/" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/courses" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Courses
                            </Link>
                        </li>
                        <li>
                            <Link to="/team" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Meet the Team
                            </Link>
                        </li>
                        <li>
                            <Link to="/privacy" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Privacy Policy
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5 border-l-2 border-indigo-500 pl-3">
                        Resources
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li>
                            <Link to="/join" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Join Community
                            </Link>
                        </li>
                        <li>
                            <Link to="/contribute" className="text-gray-400 hover:text-indigo-400 hover:pl-1 transition-all">
                                Contribution Form
                            </Link>
                        </li>
                        <li>
                            <Link to="/bug-report" className="flex items-center gap-2 text-gray-400 hover:text-red-400 hover:pl-1 transition-all">
                                <Bug size={14} /> Report a Bug
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-5 border-l-2 border-purple-500 pl-3">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:admin@oneleet.in"
                            className="group flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all"
                        >
                            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                <Mail size={16} />
                            </div>
                            <span className="text-sm text-gray-300 group-hover:text-white">admin@oneleet.in</span>
                        </a>
                    </div>
                </div>

            </div>

            <div className="border-t border-white/10 bg-black/20">
                <p className="text-center text-gray-500 text-xs py-6 px-6 leading-relaxed max-w-4xl mx-auto">
                    &copy; {new Date().getFullYear()} OneLeet. All rights reserved.
                    <br className="hidden sm:block" />
                    DISCLAIMER: All study materials and resources on ONE LEET are provided solely for educational
                    purposes. We do not claim ownership of any external materials unless stated otherwise.
                </p>
            </div>
        </footer>
    );
}