import React from "react";
import { Link } from "react-router-dom";
import { Mail, Bug } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full text-gray-300 bg-black/40 backdrop-blur-xl border-t border-white/10 mt-24">

            {/* Top Social Section */}
            <div className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
                <p className="uppercase tracking-wider text-sm text-gray-400">
                    Get Connected With Us:
                </p>

                <div className="flex items-center gap-4 text-gray-400">
                    <a href="#" className="hover:text-white transition text-xl">
                        <i className="fa-brands fa-whatsapp"></i>
                    </a>
                    <a href="#" className="hover:text-white transition text-xl">
                        <i className="fa-brands fa-instagram"></i>
                    </a>
                    <a href="#" className="hover:text-white transition text-xl">
                        <i className="fa-brands fa-linkedin"></i>
                    </a>
                </div>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Main Footer Content */}
            <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">

                {/* Branding */}
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        ONE{" "}
                        <span className="bg-gradient-to-r from-blue-300 to-indigo-500 bg-clip-text text-transparent">
                            LEET
                        </span>
                    </h2>
                    <div className="w-10 h-[2px] bg-indigo-500 my-3"></div>

                    <p className="text-gray-400 leading-relaxed text-sm">
                        Your one-stop destination for LEET learning.
                        PYQs, Notes, Smart Practice, AI Tools — all in one futuristic platform.
                    </p>
                </div>

                {/* Navigation */}
                <div>
                    <h3 className="text-sm uppercase tracking-widest text-blue-400 mb-4">Navigate</h3>
                    

                    <ul className="space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-white">Home</Link></li>
                        <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link to="/team" className="hover:text-white">Team</Link></li>
                    </ul>
                </div>

                {/* Resources */}
                <div>
                    <h3 className="text-sm uppercase tracking-widest  text-blue-400 mb-4">Resources</h3>

                    <ul className="space-y-2 text-sm">
                        <li><Link to="/join" className="hover:text-white">Join Us</Link></li>
                        <li><Link to="/contribute" className="hover:text-white">Contribution Form</Link></li>
                        <li>
                            <Link to="/bug-report" className="hover:text-white flex items-center gap-2">
                                <Bug size={14} /> Report a Bug
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-sm uppercase tracking-widest  text-blue-400 mb-4">Contact</h3>

                    <div className="border border-white/20 rounded-lg px-4 py-3 flex items-center gap-3 text-gray-300 text-sm hover:border-indigo-400 transition">
                        <Mail size={16} />
                        admin@oneleet.in
                    </div>
                </div>

            </div>

            {/* Bottom Line */}
            <div className="border-t border-white/10"></div>

            <p className="text-center text-gray-500 text-xs py-6 px-6 leading-relaxed max-w-4xl mx-auto">
                DISCLAIMER: All study materials and resources on ONE LEET are provided solely for educational
                purposes. We do not claim ownership of any external materials unless stated otherwise.
            </p>
        </footer>
    );
}
