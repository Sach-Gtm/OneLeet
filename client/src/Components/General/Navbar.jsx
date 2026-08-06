import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Menu, X, LogIn, LogOut, AlertTriangle, CheckCircle, ChevronDown, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/Components/General/Logo";
import ThemeToggle from "@/Components/App/ThemeToggle";

// Flagship exams shown in the Courses + Exams menus (the batches we lead with).
const FLAGSHIP = [
    { code: "ipu-leet", name: "IPU LEET (GGSIPU)" },
    { code: "dtu-nsut-leet", name: "DTU / NSUT LEET" },
    { code: "up-leet", name: "UP LEET (AKTU)" },
    { code: "bihar-leet", name: "Bihar LEET (BCECE-LE)" },
    { code: "haryana-leet", name: "Haryana LEET (HSTES)" },
];

// The section deep-links shown when hovering an exam in the EXAMS mega-menu.
// Anchors match the section ids on the public exam page; Colleges is its own page.
const SECTIONS = [
    { id: "pattern", label: "Exam Pattern" },
    { id: "eligibility", label: "Eligibility" },
    { id: "syllabus", label: "Syllabus" },
    { id: "seats", label: "Seat Matrix" },
    { id: "cutoffs", label: "Previous-Year Cut-offs" },
    { id: "pyqs", label: "Sample PYQs" },
];

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSuccessMsg, setShowSuccessMsg] = useState(false);
    const [openMenu, setOpenMenu] = useState(null); // 'courses' | 'exams' | null (desktop)
    const [hoverExam, setHoverExam] = useState(FLAGSHIP[0].code);
    const [mobileSection, setMobileSection] = useState(null); // 'courses' | 'exams' | null

    const { isAuthenticated: isLoggedIn, logout } = useAuth();
    const { scrollY } = useScroll();

    // Clicking any nav link closes the open menus (delegated so we don't reset
    // state in an effect on every route change).
    const closeMenus = () => { setMobileMenuOpen(false); setOpenMenu(null); };

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
            setMobileMenuOpen(false);
            setOpenMenu(null);
        } else {
            setHidden(false);
        }
        setScrolled(latest > 20);
    });

    const confirmLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        setShowSuccessMsg(true);
        setTimeout(() => setShowSuccessMsg(false), 3000);
    };

    const linkClass = "px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-colors flex items-center gap-1";

    return (
        <>
            <motion.nav
                variants={{ visible: { y: 0 }, hidden: { y: "-120%" } }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed top-0 left-0 w-full z-50 py-3 sm:py-5"
            >
                <div
                    className={`mx-auto transition-all duration-500 relative rounded-2xl px-4 sm:px-6 py-3 flex flex-col justify-center ${
                        scrolled || mobileMenuOpen || openMenu
                            ? "max-w-[95%] sm:max-w-6xl bg-white/80 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/60"
                            : "max-w-7xl bg-transparent border border-transparent"
                    }`}
                    onMouseLeave={() => setOpenMenu(null)}
                >
                    <div className="flex items-center justify-between w-full">
                        <Link to="/" className="flex items-center gap-2 relative z-10">
                            <Logo size={30} textClass="text-xl" animated />
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/70 p-1.5">
                            <Link to="/" className={linkClass}>Home</Link>

                            {/* Courses dropdown */}
                            <div className="relative" onMouseEnter={() => setOpenMenu("courses")}>
                                <button className={linkClass}>
                                    Courses <ChevronDown size={13} className={openMenu === "courses" ? "rotate-180 transition-transform" : "transition-transform"} />
                                </button>
                            </div>

                            {/* Exams mega-menu */}
                            <div className="relative" onMouseEnter={() => setOpenMenu("exams")}>
                                <button className={linkClass}>
                                    Exams <ChevronDown size={13} className={openMenu === "exams" ? "rotate-180 transition-transform" : "transition-transform"} />
                                </button>
                            </div>

                            <Link to="/community" className={linkClass}>Community</Link>
                            <Link to="/mentor" className={linkClass}>Mentors</Link>
                            <Link to="/pricing" className={linkClass}>Pricing</Link>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <ThemeToggle variant="icon" />
                            {isLoggedIn ? (
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="cursor-pointer px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                                >
                                    <LogOut size={16} /> <span>Logout</span>
                                </button>
                            ) : (
                                <Link to="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="cursor-pointer px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-colors"
                                    >
                                        <LogIn size={16} /> <span>Login</span>
                                    </motion.button>
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-1 md:hidden">
                            <ThemeToggle variant="icon" />
                            <button
                                className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Desktop dropdown panels */}
                    <AnimatePresence>
                        {openMenu === "courses" && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-1/2 top-full hidden -translate-x-1/2 pt-3 md:block"
                            >
                                <div onClick={closeMenus} className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                                    <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">College-wise batches</p>
                                    {FLAGSHIP.map((e) => (
                                        <Link key={e.code} to="/courses" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                                            {e.name} <ArrowRight size={14} className="text-slate-300" />
                                        </Link>
                                    ))}
                                    <Link to="/courses" className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                                        See all batches <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {openMenu === "exams" && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-1/2 top-full hidden -translate-x-1/2 pt-3 md:block"
                            >
                                <div onClick={closeMenus} className="flex w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                    {/* Exam list */}
                                    <div className="w-1/2 border-r border-slate-100 p-2">
                                        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Popular exams</p>
                                        {FLAGSHIP.map((e) => (
                                            <Link
                                                key={e.code}
                                                to={`/exams/${e.code}`}
                                                onMouseEnter={() => setHoverExam(e.code)}
                                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${hoverExam === e.code ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
                                            >
                                                {e.name} <ArrowRight size={14} className="text-slate-300" />
                                            </Link>
                                        ))}
                                        <Link to="/exams" className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                                            All exams
                                        </Link>
                                    </div>
                                    {/* Section side-panel for the hovered exam */}
                                    <div className="w-1/2 p-2">
                                        <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Explore — free</p>
                                        {SECTIONS.map((s) => (
                                            <Link key={s.id} to={`/exams/${hoverExam}#${s.id}`} className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                                                {s.label}
                                            </Link>
                                        ))}
                                        <Link to="/colleges" className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">Colleges</Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden md:hidden w-full"
                            >
                                <div onClick={(e) => e.target.closest("a") && closeMenus()} className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4">
                                    <Link to="/" className="rounded-xl p-3 text-base font-medium text-slate-700 hover:bg-slate-100">Home</Link>

                                    <MobileAccordion label="Courses" open={mobileSection === "courses"} onToggle={() => setMobileSection(mobileSection === "courses" ? null : "courses")}>
                                        {FLAGSHIP.map((e) => (
                                            <Link key={e.code} to="/courses" className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">{e.name}</Link>
                                        ))}
                                        <Link to="/courses" className="block rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700">See all batches →</Link>
                                    </MobileAccordion>

                                    <MobileAccordion label="Exams" open={mobileSection === "exams"} onToggle={() => setMobileSection(mobileSection === "exams" ? null : "exams")}>
                                        {FLAGSHIP.map((e) => (
                                            <Link key={e.code} to={`/exams/${e.code}`} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">{e.name}</Link>
                                        ))}
                                        <Link to="/exams" className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">All exams</Link>
                                        <Link to="/colleges" className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Colleges</Link>
                                    </MobileAccordion>

                                    <Link to="/community" className="rounded-xl p-3 text-base font-medium text-slate-700 hover:bg-slate-100">Community</Link>
                                    <Link to="/mentor" className="rounded-xl p-3 text-base font-medium text-slate-700 hover:bg-slate-100">Mentors</Link>
                                    <Link to="/pricing" className="rounded-xl p-3 text-base font-medium text-slate-700 hover:bg-slate-100">Pricing</Link>

                                    <div className="my-2 h-px bg-slate-200" />
                                    {isLoggedIn ? (
                                        <button onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-600 hover:bg-red-500 hover:text-white">
                                            <LogOut size={18} /> Logout
                                        </button>
                                    ) : (
                                        <Link to="/login">
                                            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 font-bold text-white hover:bg-indigo-700">
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

            {/* Logout confirm */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-500">
                                    <AlertTriangle size={28} />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-slate-900">Sign Out?</h3>
                                <p className="mb-6 text-sm leading-relaxed text-slate-500">Are you sure you want to end your session? You&apos;ll need to log in again.</p>
                                <div className="flex w-full gap-3">
                                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-200">Cancel</button>
                                    <button onClick={confirmLogout} className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 font-medium text-white hover:from-red-500 hover:to-red-400">Logout</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessMsg && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-24 right-4 z-[70] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 shadow-xl md:right-8">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                            <CheckCircle size={14} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Logged Out</p>
                            <p className="mt-0.5 text-xs text-slate-500">Come back soon!</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function MobileAccordion({ label, open, onToggle, children }) {
    return (
        <div className="rounded-xl">
            <button onClick={onToggle} className="flex w-full items-center justify-between rounded-xl p-3 text-base font-medium text-slate-700 hover:bg-slate-100">
                {label} <ChevronDown size={16} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-3">
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
