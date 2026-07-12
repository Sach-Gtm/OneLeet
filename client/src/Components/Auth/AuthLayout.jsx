import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Trophy, FileText, Bot } from "lucide-react";
import ShaderHero from "@/Components/General/ShaderHero";
import { LogoMark } from "@/Components/General/Logo";

// A weightless chip that floats up into place on mount, then holds still — the
// "antigravity" intro. It replays whenever the page mounts (login → register).
function FloatingChip({ icon: Icon, label, sub, className, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: [28, -10, 3, 0] }}
            transition={{ duration: 1.1, delay, ease: "easeOut" }}
            className={`absolute flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/80 px-3.5 py-2.5 shadow-lg shadow-indigo-200/50 backdrop-blur-md ${className}`}
        >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <Icon className="h-4 w-4" />
            </span>
            <div className="text-left">
                <div className="text-xs font-bold text-slate-800">{label}</div>
                {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
            </div>
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

                {/* Floating chips (decorative, behind the copy) */}
                <div className="pointer-events-none absolute inset-0 z-10">
                    <FloatingChip icon={Trophy} label="Rank 54" sub="IPU LEET 2025" className="right-12 top-24" delay={0.1} dur={4.6} />
                    <FloatingChip icon={FileText} label="Real PYQs" sub="Years of papers" className="left-14 top-44" delay={0.35} dur={5.4} />
                    <FloatingChip icon={Bot} label="AI practice" sub="Unlimited questions" className="right-20 top-64" delay={0.6} dur={4.2} />
                </div>

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
