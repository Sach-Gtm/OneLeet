import { Link } from "react-router-dom";
import { GraduationCap, Sparkles } from "lucide-react";

// Aspirational, self-contained SVG hero — growth bars rising along a golden
// trajectory to a graduation cap. Pure vectors (no external image), themed in
// the app's indigo + gold palette so it scales crisply on every screen.
function AspirationArt() {
    return (
        <svg
            viewBox="0 0 320 220"
            className="h-auto w-full max-w-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="al-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="al-bar" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
                </linearGradient>
            </defs>

            <circle cx="160" cy="80" r="72" fill="url(#al-glow)" />

            <g>
                <rect x="70" y="150" width="26" height="40" rx="6" fill="url(#al-bar)" />
                <rect x="110" y="128" width="26" height="62" rx="6" fill="url(#al-bar)" />
                <rect x="150" y="104" width="26" height="86" rx="6" fill="url(#al-bar)" />
                <rect x="190" y="150" width="26" height="40" rx="6" fill="url(#al-bar)" />
            </g>
            <line
                x1="56"
                y1="190"
                x2="264"
                y2="190"
                stroke="#ffffff"
                strokeOpacity="0.25"
                strokeWidth="2"
            />

            <path
                d="M70 168 C120 150 150 120 210 70"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="2 9"
            />

            <g transform="translate(160 66)">
                <circle r="34" fill="#4f46e5" stroke="#fbbf24" strokeWidth="2.5" />
                <path d="M-22 -2 L0 -12 L22 -2 L0 8 Z" fill="#ffffff" />
                <path
                    d="M-13 3 L-13 12 C-13 19 13 19 13 12 L13 3 L0 9 Z"
                    fill="#ffffff"
                    fillOpacity="0.85"
                />
                <path
                    d="M22 -2 L22 12"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <circle cx="22" cy="14" r="2.6" fill="#fbbf24" />
            </g>

            <g fill="#fde68a">
                <path d="M250 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" />
                <path d="M60 88 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.85" />
                <path d="M272 118 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" opacity="0.7" />
            </g>
        </svg>
    );
}

// Shared split-panel shell for the light auth screens (login / register /
// forgot / reset). Left = aspirational brand hero (hidden on mobile), right =
// the form.
export default function AuthLayout({ heading, subheading, stats = [], children }) {
    return (
        <div className="grid min-h-screen w-full bg-white lg:grid-cols-2">
            {/* Brand panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 p-12 text-white lg:flex">
                {/* warm gold + indigo ambient glows */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-12 h-56 w-56 rounded-full bg-amber-500/10 blur-2xl" />

                <Link to="/" className="relative z-10 flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold tracking-tight">
                        One<span className="text-amber-400">Leet</span>
                    </span>
                </Link>

                <div className="relative z-10 space-y-7">
                    <div className="flex justify-center">
                        <AspirationArt />
                    </div>

                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
                            <Sparkles className="h-3.5 w-3.5" /> Where rank-holders are
                            made
                        </span>
                        <h1 className="text-3xl font-extrabold leading-tight xl:text-4xl">
                            {heading}
                        </h1>
                        {subheading && (
                            <p className="max-w-sm text-base leading-relaxed text-indigo-100/85">
                                {subheading}
                            </p>
                        )}
                        {stats.length > 0 && (
                            <div className="flex gap-8 pt-1">
                                {stats.map((s) => (
                                    <div key={s.label}>
                                        <div className="text-3xl font-bold text-amber-400">
                                            {s.value}
                                        </div>
                                        <div className="text-xs uppercase tracking-wider text-indigo-200">
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-indigo-200/70">
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
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-bold tracking-tight text-slate-900">
                            One<span className="text-amber-500">Leet</span>
                        </span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
