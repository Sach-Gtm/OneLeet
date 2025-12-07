import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    ChevronRight,
    Rocket,
    BookOpen,
    StickyNote,
    FileQuestion,
    Users,
    Bot,
    LogIn,
    UserPlus
} from "lucide-react";

export default function Navbar() {
    const location = useLocation();
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
    const navRefs = useRef([]);

    const navLinks = [
        { name: "Home", path: "/", icon: <Rocket size={14} /> },
        { name: "PYQs", path: "/pyqs", icon: <FileQuestion size={14} /> },
        { name: "Notes", path: "/notes", icon: <StickyNote size={14} /> },
        { name: "Tests", path: "/tests", icon: <BookOpen size={14} /> },
        { name: "AI Tools", path: "/ai-tools", icon: <Bot size={14} /> },
        { name: "Mentors", path: "/mentor", icon: <Users size={14} /> },
    ];

    const movePillTo = (path) => {
        const index = navLinks.findIndex((link) => link.path === path);
        const el = navRefs.current[index];
        if (el) {
            setPillStyle({
                left: el.offsetLeft,
                width: el.offsetWidth,
                opacity: 1,
            });
        }
    };

    const resetPill = () => movePillTo(location.pathname);

    useEffect(() => {
        movePillTo(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            setScrolled(current > 20);

            if (current > lastScroll && current > 50 && !mobileMenuOpen) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            setLastScroll(current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScroll, mobileMenuOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    return (
        <>
            <nav
                className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-500
        ${hidden ? "-translate-y-[150%]" : "translate-y-0"}
        py-5
    `}
            >

                <div
                    className={`
                        mx-auto transition-all duration-500
                        ${scrolled ? "max-w-5xl" : "max-w-6xl"}
                        ${mobileMenuOpen ? "rounded-t-2xl" : "rounded-2xl"}
                        backdrop-blur-xl bg-transparent
                        border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                        px-6 py-3 md:py-4 flex items-center justify-between relative
                    `}
                >

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-2 relative z-10">
                        <span className="text-xl font-bold tracking-tight text-white">
                            ONE <span className="bg-gradient-to-r from-blue-300 to-indigo-500 bg-clip-text text-transparent">LEET</span>
                        </span>
                    </Link>

                    {/* DESKTOP NAV LINKS */}
                    <div
                        className="hidden md:flex items-center bg-black/20 rounded-full p-1 border border-white/5 relative"
                        onMouseLeave={resetPill}
                    >
                        <div
                            className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 pointer-events-none"
                            style={pillStyle}
                        />

                        {navLinks.map((link, index) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    ref={(el) => (navRefs.current[index] = el)}
                                    onMouseEnter={() => movePillTo(link.path)}
                                    className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition
                                        ${isActive ? "text-white" : "text-gray-400 hover:text-white"}
                                    `}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* AUTH BUTTONS */}
                    <div className="hidden md:flex items-center gap-4 relative z-10">

                        <Link to="/user/register">
                            <button
                                className=" cursor-pointer group relative px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-sm font-semibold flex items-center gap-1"
                            >
                                <LogIn size={16} />
                                Login
                            </button>
                        </Link>
                    </div>

                    {/* MOBILE MENU TOGGLE */}
                    <button
                        className="md:hidden text-gray-300 hover:text-white p-1 relative z-10"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                </div>

                {/* MOBILE MENU */}
                {mobileMenuOpen && (
                    <div className="md:hidden mx-auto max-w-6xl bg-[#0a0a1a]/95 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl overflow-hidden">
                        <div className="p-6 flex flex-col gap-2">

                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`p-3 rounded-xl flex items-center gap-2 text-base transition
                                        ${location.pathname === link.path
                                            ? "bg-blue-600/20 border border-blue-500/30 text-white"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                >
                                    {link.icon}
                                    {link.name}
                                </Link>
                            ))}

                            <div className="h-px bg-white/10 my-2" />

                            <Link to="/user/login" className="p-3 flex items-center gap-2 text-gray-300">
                                <LogIn size={18} /> Login
                            </Link>


                        </div>
                    </div>
                )}
            </nav>


        </>
    );
}
