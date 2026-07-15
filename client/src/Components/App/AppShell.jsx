import { useState, useEffect, useRef, Suspense } from "react";
import { NavLink, Outlet, useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import {
    LayoutDashboard,
    FileQuestion,
    BookOpen,
    ClipboardList,
    Sparkles,
    BarChart3,
    Trophy,
    Users,
    User,
    Search,
    LogOut,
    Menu,
    X,
    Loader2,
    ShieldCheck,
    ChevronDown,
    Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/Components/App/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/Components/General/Logo";
import Footer from "@/Components/General/Footer";
import { isProfileComplete } from "@/lib/profile";
import { isStaff as isStaffUser, roleLabel } from "@/lib/roles";

const NAV = [
    {
        section: null,
        items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/pyqs", label: "PYQs", icon: FileQuestion },
            { to: "/notes", label: "Notes", icon: BookOpen },
            { to: "/tests", label: "Tests", icon: ClipboardList },
        ],
    },
    {
        section: "AI & Stats",
        items: [
            { to: "/ai-tools", label: "AI Tools", icon: Sparkles },
            { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
            { to: "/analytics", label: "Analytics", icon: BarChart3 },
        ],
    },
    {
        section: "Community",
        items: [
            { to: "/community", label: "Community", icon: Users },
            { to: "/profile", label: "Profile", icon: User },
        ],
    },
];

function planLabel(user) {
    return roleLabel(user);
}

function SidebarContent({ user, onNavigate, onLogout }) {
    const linkClass = ({ isActive }) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        );

    // Staff (mentor/admin/super admin) get an extra Admin section.
    const isStaff = isStaffUser(user);
    const navGroups = isStaff
        ? [
              ...NAV,
              {
                  section: "Staff",
                  items: [
                      { to: "/studio", label: "Content Studio", icon: Wand2 },
                      { to: "/admin", label: "Admin", icon: ShieldCheck },
                  ],
              },
          ]
        : NAV;

    return (
        <div className="flex h-full flex-col">
            <Link
                to="/dashboard"
                onClick={onNavigate}
                className="flex items-center gap-2 px-5 py-5"
            >
                <Logo size={32} textClass="text-lg" />
            </Link>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
                {navGroups.map((group, i) => (
                    <div key={i} className="space-y-1">
                        {group.section && (
                            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                {group.section}
                            </p>
                        )}
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onNavigate}
                                    className={linkClass}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="border-t border-slate-100 p-3">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {(user?.name || "U").charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {planLabel(user)}
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        aria-label="Sign out"
                    >
                        <LogOut size={18} />
                    </button>
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

    const Avatar = user?.avatar ? (
        <img
            src={user.avatar}
            alt={user.name}
            className="h-9 w-9 rounded-full object-cover"
        />
    ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {(user?.name || "U").charAt(0).toUpperCase()}
        </span>
    );

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
                        <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.name || "User"}
                        </p>
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

export default function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const isStaff = isStaffUser(user);

    // Profile is mandatory: until every required field is filled, keep the user
    // on /profile (they can still log out from the header). Once complete, the
    // whole app opens up.
    const gated = user && !isProfileComplete(user) && location.pathname !== "/profile";

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
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
                <div className="sticky top-0 h-screen">
                    <SidebarContent user={user} onLogout={handleLogout} />
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

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
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
                        {gated ? <Navigate to="/profile" replace /> : <Outlet />}
                    </Suspense>
                </main>
                {/* Site footer on every logged-in page too (not on login/register,
                    which don't use this shell). */}
                <Footer />
            </div>
        </div>
    );
}
