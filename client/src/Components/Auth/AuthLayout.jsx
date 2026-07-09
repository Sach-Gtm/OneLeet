import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

// Shared split-panel shell for the light auth screens (login / register /
// forgot / reset). Left = brand hero (hidden on mobile), right = the form.
export default function AuthLayout({ heading, subheading, stats = [], children }) {
    return (
        <div className="grid min-h-screen w-full bg-white lg:grid-cols-2">
            {/* Brand panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white lg:flex">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

                <Link to="/" className="relative z-10 flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold tracking-tight">
                        One<span className="text-blue-200">Leet</span>
                    </span>
                </Link>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl font-extrabold leading-tight">{heading}</h1>
                    {subheading && (
                        <p className="max-w-sm text-base leading-relaxed text-blue-100/90">
                            {subheading}
                        </p>
                    )}
                    {stats.length > 0 && (
                        <div className="flex gap-10 pt-2">
                            {stats.map((s) => (
                                <div key={s.label}>
                                    <div className="text-3xl font-bold">{s.value}</div>
                                    <div className="text-xs uppercase tracking-wider text-blue-200">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="relative z-10 text-xs text-blue-200/80">
                    Trusted by thousands of LEET aspirants across India.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-md">
                    {/* Compact brand for mobile (brand panel is hidden) */}
                    <Link
                        to="/"
                        className="mb-8 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-bold tracking-tight text-slate-900">
                            One<span className="text-blue-600">Leet</span>
                        </span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
