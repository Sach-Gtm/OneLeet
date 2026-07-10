import { useState, Suspense } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
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
    GraduationCap,
    Search,
    Bell,
    LogOut,
    Menu,
    X,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
    if (user?.plan === "pro") return "Premium Student";
    return user?.role === "teacher" ? "Teacher" : "Student";
}

function SidebarContent({ user, onNavigate, onLogout }) {
    const linkClass = ({ isActive }) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        );

    // Staff (admin/teacher) get an extra Admin section.
    const isStaff = user?.role === "admin" || user?.role === "teacher";
    const navGroups = isStaff
        ? [
              ...NAV,
              {
                  section: "Staff",
                  items: [{ to: "/admin", label: "Admin", icon: ShieldCheck }],
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
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                    <GraduationCap className="h-5 w-5" />
                </span>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                    One<span className="text-amber-500">Leet</span>
                </span>
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

export default function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
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
                        <button
                            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            aria-label="Notifications"
                        >
                            <Bell size={18} />
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                        </button>
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
            </div>
        </div>
    );
}
