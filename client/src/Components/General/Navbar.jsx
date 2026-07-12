import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    Rocket,
    BookOpen,
    StickyNote,
    FileQuestion,
    Users,
    Bot,
    LogIn,
    LogOut,
    AlertTriangle,
    CheckCircle,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/Components/General/Logo";

export default function Navbar() {
    const location = useLocation();
    const [hidden, setHidden] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSuccessMsg, setShowSuccessMsg] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(location.pathname);

    const { isAuthenticated: isLoggedIn, logout } = useAuth();
    const { scrollY } = useScroll();

    const navLinks = [
        { name: "Home", path: "/", icon: <Rocket size={16} /> },
        { name: "PYQs", path: "/pyqs", icon: <FileQuestion size={16} /> },
        { name: "Notes", path: "/notes", icon: <StickyNote size={16} /> },
        { name: "Tests", path: "/tests", icon: <BookOpen size={16} /> },
        { name: "Our Team", path: "/team", icon: <Bot size={16} /> },
        { name: "Mentors", path: "/mentor", icon: <Users size={16} /> },
    ];

    useEffect(() => {
        setHoveredPath(location.pathname);
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
            setMobileMenuOpen(false);
        } else {
            setHidden(false);
        }
        setScrolled(latest > 20);
    });

    const handleLogoutClick = () => {
        setMobileMenuOpen(false);
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        setShowSuccessMsg(true);
        setTimeout(() => setShowSuccessMsg(false), 3000);
    };

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-120%" },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={`fixed top-0 left-0 w-full z-50 py-3 sm:py-5 transition-all duration-300`}
            >
                <div
                    className={`
            mx-auto transition-all duration-500 relative
            ${scrolled || mobileMenuOpen ? "max-w-[95%] sm:max-w-5xl bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/60" : "max-w-7xl bg-transparent border-transparent"}
            ${mobileMenuOpen ? "rounded-2xl" : "rounded-2xl"}
            px-4 sm:px-6 py-3 flex flex-col justify-center
          `}
                >
                    <div className="flex items-center justify-between w-full">
                        <Link to="/" className="flex items-center gap-2 relative z-10 group">
                            <Logo size={30} textClass="text-xl" />
                        </Link>

                        <div
                            className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200"
                            onMouseLeave={() => setHoveredPath(location.pathname)}
                        >
                            {navLinks.map((link) => {
                                const isActive = link.path === hoveredPath;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onMouseEnter={() => setHoveredPath(link.path)}
                                        className={`
                      relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 z-10 flex items-center gap-2
                      ${isActive ? "text-white" : "text-slate-500 hover:text-slate-800"}
                    `}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="navbar-pill"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-lg shadow-indigo-500/25 -z-10"
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-1.5">
                                            {link.icon}
                                            {link.name}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            {isLoggedIn ? (
                                <button
                                    onClick={handleLogoutClick}
                                    className=" cursor-pointer px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            ) : (
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="cursor-pointer px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-colors"
                                    >
                                        <LogIn size={16} />
                                        <span>Login</span>
                                    </motion.button>
                                </Link>
                            )}
                        </div>

                        <button
                            className="md:hidden text-slate-700 p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <AnimatePresence mode="wait">
                                {mobileMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                    >
                                        <X size={24} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                    >
                                        <Menu size={24} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>

                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden md:hidden w-full"
                            >
                                <div className="pt-4 pb-2 flex flex-col gap-2 border-t border-slate-200 mt-4">
                                    {navLinks.map((link, i) => (
                                        <motion.div
                                            key={link.path}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                to={link.path}
                                                className={`
                          p-3 rounded-xl flex items-center justify-between text-base font-medium transition-all
                          ${location.pathname === link.path
                                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}
                        `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {link.icon}
                                                    {link.name}
                                                </div>
                                                {location.pathname === link.path && <ChevronRight size={16} />}
                                            </Link>
                                        </motion.div>
                                    ))}

                                    <div className="h-px bg-slate-200 my-2" />

                                    {isLoggedIn ? (
                                        <button
                                            onClick={handleLogoutClick}
                                            className="p-3 w-full rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center gap-2 font-semibold hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <LogOut size={18} /> Logout
                                        </button>
                                    ) : (
                                        <Link to="/login">
                                            <button className="w-full p-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                                                <LogIn size={18} /> Login
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.nav>

            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 blur-3xl rounded-full pointer-events-none" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center mb-4 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
                                    <AlertTriangle size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Out?</h3>
                                <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                                    Are you sure you want to end your session? You&apos;ll need to log in again to access your account.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmLogout}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:from-red-500 hover:to-red-400 transition shadow-lg shadow-red-600/20"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessMsg && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed top-24 right-4 md:right-8 z-[70] flex items-center gap-3 bg-white border border-green-200 px-5 py-4 rounded-xl shadow-xl"
                    >
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-black">
                            <CheckCircle size={14} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Logged Out</p>
                            <p className="text-xs text-slate-500 mt-0.5">Come back soon!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}