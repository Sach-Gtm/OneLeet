import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import ShaderHero from "@/Components/General/ShaderHero";
import GrowthCanvas from "@/Components/General/GrowthCanvas";
import { LogoMark } from "@/Components/General/Logo";

// A StaplerLabs-style analytics card — a self-drawing growth chart that floats
// into place on mount, then holds. Custom-built, on-brand, and it replays each
// time the page mounts (login → register).
function ProgressCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="absolute right-10 top-24 z-10 w-72 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-indigo-200/50 backdrop-blur-md"
        >
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Your progress</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <TrendingUp className="h-3 w-3" /> Rising
                </span>
            </div>
            <GrowthCanvas className="block h-36 w-full" />
            <p className="mt-2 text-[11px] text-slate-400">Every focused session moves you up.</p>
        </motion.div>
    );
}

// Shared split-panel shell for the light auth screens (login / register /
// forgot / reset). Left = animated brand panel (hidden on mobile), right = form.
export default function AuthLayout({ heading, subheading, stats = [], children }) {
    return (
        <div className="grid min-h-screen w-full bg-white lg:grid-cols-2">
            {/* Brand panel — light, animated, weightless */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-12 lg:flex">
                {/* Live pastel aurora + a soft wash to keep text crisp */}
                <ShaderHero className="absolute inset-0" />
                <div className="pointer-events-none absolute inset-0 bg-white/25" />

                <Link to="/" className="relative z-20 flex items-center gap-2.5">
                    <LogoMark size={46} animated />
                    <div className="leading-tight">
                        <span className="block text-lg font-extrabold tracking-tight">
                            <span className="text-[#EC7A54]">One</span>
                            <span className="text-[#3FB0D6]">Leet</span>
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400">
                            A StaplerLabs product
                        </span>
                    </div>
                </Link>

                {/* Custom analytics card (replaces the old stat chips) */}
                <ProgressCard />

                <div className="relative z-20 max-w-sm space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5" /> Where rank-holders are made
                    </span>
                    <h1 className="text-3xl font-extrabold leading-tight text-slate-900 xl:text-4xl">
                        {heading}
                    </h1>
                    {subheading && (
                        <p className="max-w-sm text-base leading-relaxed text-slate-600">
                            {subheading}
                        </p>
                    )}
                    {stats.length > 0 && (
                        <div className="flex gap-8 pt-1">
                            {stats.map((s) => (
                                <div key={s.label}>
                                    <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="relative z-20 text-xs text-slate-500">
                    Trusted by thousands of LEET aspirants across India.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-md">
                    {/* Compact brand for mobile (brand panel is hidden) */}
                    <Link
                        to="/"
                        className="mb-8 flex flex-col items-center justify-center gap-1 lg:hidden"
                    >
                        <div className="flex items-center gap-2">
                            <LogoMark size={36} animated />
                            <span className="text-lg font-extrabold tracking-tight">
                                <span className="text-[#EC7A54]">One</span>
                                <span className="text-[#3FB0D6]">Leet</span>
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                            A StaplerLabs product
                        </span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
