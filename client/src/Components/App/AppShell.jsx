import { useState, useEffect, useRef, Suspense } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
    LayoutDashboard,
    GraduationCap,
    FileQuestion,
    BookOpen,
    ClipboardList,
    ListChecks,
    MonitorPlay,
    Compass,
    Brain,
    Trophy,
    Users,
    User,
    Package,
    Gift,
    Home,
    Search,
    LogOut,
    Menu,
    X,
    Loader2,
    ShieldCheck,
    ChevronDown,
    PencilRuler,
    ScrollText,
    PanelLeftClose,
    PanelLeftOpen,
    Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/Components/App/NotificationBell";
import ThemeToggle from "@/Components/App/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import Logo, { LogoMark } from "@/Components/General/Logo";
import Footer from "@/Components/General/Footer";
import { PremiumAvatar, PremiumMemberPill } from "@/Components/App/premium/PremiumFx";
import { isStaff as isStaffUser, isPremium, roleLabel } from "@/lib/roles";

const NAV = [
    {
        section: null,
        items: [
            { to: "/", label: "Home", icon: Home, end: true }, // back to the public landing page
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/courses", label: "Courses", icon: GraduationCap },
            { to: "/prep-guide", label: "Prep Guide", icon: Compass },
            { to: "/exam-pattern", label: "Exam Pattern", icon: ScrollText },
            { to: "/pyqs", label: "PYQs", icon: FileQuestion },
            { to: "/notes", label: "Notes", icon: BookOpen },
            { to: "/syllabus", label: "Syllabus", icon: ListChecks },
            { to: "/tests", label: "Tests", icon: ClipboardList },
            { to: "/videos", label: "Videos", icon: MonitorPlay },
        ],
    },
    {
        section: "AI & Stats",
        items: [
            { to: "/ai-tools", label: "AI Tools", icon: Brain },
            { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
        ],
    },
    {
        section: "Community",
        items: [
            { to: "/community", label: "Community", icon: Users },
            { to: "/refer", label: "Refer & Earn", icon: Gift },
            { to: "/orders", label: "My Orders", icon: Package },
            { to: "/profile", label: "Profile", icon: User },
        ],
    },
];

function planLabel(user) {
    return roleLabel(user);
}

function SidebarContent({ user, onNavigate, onLogout, collapsed = false, onToggleCollapse }) {
    const linkClass = ({ isActive }) =>
        cn(
            "flex items-center rounded-lg text-sm font-medium transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
            isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        );

    // Staff (mentor/admin/super admin) get an extra Admin section.
    const isStaff = isStaffUser(user);
    const premium = isPremium(user);
    const navGroups = isStaff
        ? [
              ...NAV,
              {
                  section: "Staff",
                  items: [
                      { to: "/studio", label: "Content Studio", icon: PencilRuler },
                      { to: "/admin", label: "Admin", icon: ShieldCheck },
                  ],
              },
          ]
        : NAV;

    return (
        <div className="flex h-full flex-col">
            <div className={cn("flex items-center py-5", collapsed ? "justify-center px-2" : "justify-between px-5")}>
                {/* Logo goes to the public landing page (no logout), per spec. */}
                <Link to="/" onClick={onNavigate} className="flex items-center gap-2">
                    {collapsed ? <LogoMark size={30} /> : <Logo size={32} textClass="text-lg" />}
                </Link>
                {/* Collapse toggle — desktop only (onToggleCollapse is undefined in the mobile drawer). */}
                {onToggleCollapse && !collapsed && (
                    <button
                        onClick={onToggleCollapse}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Collapse sidebar"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                )}
            </div>

            {onToggleCollapse && collapsed && (
                <button
                    onClick={onToggleCollapse}
                    className="mx-auto mb-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                >
                    <PanelLeftOpen size={18} />
                </button>
            )}

            <nav className={cn("flex-1 overflow-y-auto py-2", collapsed ? "space-y-2 px-2" : "space-y-6 px-3")}>
                {navGroups.map((group, i) => (
                    <div key={i} className="space-y-1">
                        {group.section && !collapsed && (
                            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                {group.section}
                            </p>
                        )}
                        {group.section && collapsed && i > 0 && <div className="mx-2 my-1 h-px bg-slate-100" />}
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={onNavigate}
                                    className={linkClass}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon size={18} />
                                    {!collapsed && item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="border-t border-slate-100 p-3">
                {/* Light / dark switch — lives in the bottom nav, on every page. */}
                {!collapsed && <ThemeToggle />}
                <div className={cn("flex items-center rounded-lg py-2", collapsed ? "justify-center px-0" : "gap-3 px-2")}>
                    <PremiumAvatar user={user} size={36} premium={premium} />
                    {!collapsed && (
                        <>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{user?.name || "User"}</p>
                                {premium ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        <Crown size={11} className="text-amber-500" fill="currentColor" /> Premium Member
                                    </span>
                                ) : (
                                    <p className="truncate text-xs text-slate-400">{planLabel(user)}</p>
                                )}
                            </div>
                            <button
                                onClick={onLogout}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                                aria-label="Sign out"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Avatar + chevron in the topbar; clicking opens an account menu (Profile,
// Admin for staff, and Log out).
function UserMenu({ user, isStaff, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const Avatar = <PremiumAvatar user={user} size={36} premium={isPremium(user)} />;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1 rounded-lg p-0.5 hover:bg-slate-100"
                aria-label="Account menu"
            >
                {Avatar}
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-slate-400 transition-transform",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <div className="px-3 py-2">
                        <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                                {user?.name || "User"}
                            </p>
                            {isPremium(user) && <PremiumMemberPill />}
                        </div>
                        <p className="truncate text-xs text-slate-400">
                            {user?.email}
                        </p>
                    </div>
                    <div className="my-1 h-px bg-slate-100" />
                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                        <User size={16} /> Profile
                    </Link>
                    {isStaff && (
                        <Link
                            to="/admin"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                            <ShieldCheck size={16} /> Admin
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={16} /> Log out
                    </button>
                </div>
            )}
        </div>
    );
}

// Native-style bottom tab bar (mobile only). Four core destinations plus a
// "More" tab that opens the full drawer — the app pattern instead of a website
// hamburger. Sits above the home indicator via pb-safe.
const TAB_ITEMS = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/tests", label: "Tests", icon: ClipboardList },
    { to: "/videos", label: "Videos", icon: MonitorPlay },
    { to: "/pyqs", label: "PYQs", icon: FileQuestion },
];
function MobileTabBar({ onMore }) {
    const cls = ({ isActive }) =>
        cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
            isActive ? "text-indigo-600" : "text-slate-400"
        );
    return (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            {TAB_ITEMS.map((t) => {
                const Icon = t.icon;
                return (
                    <NavLink key={t.to} to={t.to} className={cls}>
                        <Icon size={21} />
                        {t.label}
                    </NavLink>
                );
            })}
            <button
                type="button"
                onClick={onMore}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-slate-400"
            >
                <Menu size={21} />
                More
            </button>
        </nav>
    );
}

export default function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    // Collapsible desktop sidebar (Claude/GPT-style), remembered across sessions.
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem("ol_sidebar_collapsed") === "1");
    const toggleCollapsed = () =>
        setCollapsed((v) => {
            localStorage.setItem("ol_sidebar_collapsed", v ? "0" : "1");
            return !v;
        });
    const isStaff = isStaffUser(user);
    const premium = isPremium(user);

    // The profile is never a hard gate: students land in the app immediately and
    // fill their details at their own pace (the Profile page shows a completion
    // meter instead). Onboarding asks nothing beyond what signup already captured.

    const handleLogout = async () => {
        // Leave the protected area FIRST, then clear auth. The moment `user`
        // goes null, the ProtectedRoute wrapping this shell renders its own
        // <Navigate to="/login">, which would beat an after-the-fact
        // navigate("/"). Landing on the public home page before logout runs
        // sidesteps that guard, so logout goes home — never to the login form.
        navigate("/", { replace: true });
        await logout();
    };

    return (
        <div className="flex min-h-screen bg-[#FAF9F6]">
            {/* Desktop sidebar (collapsible) */}
            <aside className={cn("hidden shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 lg:block", collapsed ? "w-16" : "w-64")}>
                <div className="sticky top-0 h-screen">
                    <SidebarContent user={user} onLogout={handleLogout} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
                </div>
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white shadow-xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                        <SidebarContent
                            user={user}
                            onNavigate={() => setMobileOpen(false)}
                            onLogout={handleLogout}
                        />
                    </aside>
                </div>
            )}

            {/* Main column (bottom padding on mobile so content clears the tab bar) */}
            <div className="flex min-w-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
                <header className="relative sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
                    {/* Premium members carry a faint gold hairline on every page. */}
                    {premium && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
                    )}
                    {/* Mobile: brand top-left (nav lives in the bottom bar). */}
                    <Link to="/dashboard" className="lg:hidden" aria-label="OneLeet home">
                        <Logo size={26} textClass="text-base" />
                    </Link>
                    <div className="relative hidden max-w-md flex-1 sm:block">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search for topics, tests, or notes..."
                            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle variant="icon" />
                        <NotificationBell />
                        <UserMenu
                            user={user}
                            isStaff={isStaff}
                            onLogout={handleLogout}
                        />
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <Suspense
                        fallback={
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </main>
                {/* Site footer on every logged-in page too (not on login/register,
                    which don't use this shell). */}
                <Footer />
            </div>

            {/* App-style bottom navigation (mobile only) */}
            <MobileTabBar onMore={() => setMobileOpen(true)} />
        </div>
    );
}
