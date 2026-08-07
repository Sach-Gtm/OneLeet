import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Play, Headphones, Unlock, Brain, Trophy, Sparkles as SparkIcon } from "lucide-react";
import { whatsappLink, WHATSAPP_RESPONSE } from "@/config/support";

// The warm "gold membership" visual language a premium (pro) student sees, so
// premium *feels* premium — creative, warm and alive. Everything here is
// decorative and pointer-safe; ambient motion is CSS (see index.css) and stops
// under `prefers-reduced-motion`. Reused across the dashboard (and, later, any
// page that wants to feel first-class).

// Warm aurora + gold glows sitting behind hero content. The host needs
// `relative overflow-hidden`.
export function PremiumAura() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="ol-aurora absolute -left-1/4 -top-1/3 h-[150%] w-2/3 rounded-full bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-transparent blur-3xl" />
            <div
                className="ol-aurora absolute -right-1/4 top-0 h-[150%] w-2/3 rounded-full bg-gradient-to-bl from-yellow-300/25 via-amber-500/15 to-transparent blur-3xl"
                style={{ animationDelay: "-7s" }}
            />
            <div className="ol-glow absolute right-10 top-6 h-40 w-40 rounded-full bg-amber-300/25 blur-2xl" />
        </div>
    );
}

// A few drifting gold sparkles. Positions are fixed (no RNG) so nothing churns
// between renders.
const SPARKS = [
    { top: "16%", left: "10%", size: 11, dur: "5s", delay: "0s" },
    { top: "24%", left: "84%", size: 7, dur: "6.6s", delay: "-1.4s" },
    { top: "64%", left: "20%", size: 8, dur: "5.6s", delay: "-2.1s" },
    { top: "74%", left: "70%", size: 12, dur: "7s", delay: "-0.7s" },
    { top: "42%", left: "52%", size: 6, dur: "6s", delay: "-3s" },
    { top: "18%", left: "62%", size: 6, dur: "5.2s", delay: "-2.6s" },
];
export function Sparkles() {
    return (
        <div className="pointer-events-none absolute inset-0">
            {SPARKS.map((s, i) => (
                <span
                    key={i}
                    className="ol-float absolute text-amber-200 drop-shadow-[0_0_5px_rgba(251,191,36,0.7)]"
                    style={{ top: s.top, left: s.left, "--ol-float-dur": s.dur, animationDelay: s.delay }}
                >
                    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0l2.4 8.4L22 12l-7.6 3.6L12 24l-2.4-8.4L2 12l7.6-3.6z" />
                    </svg>
                </span>
            ))}
        </div>
    );
}

// The crown emblem — a gilded disc with a slowly rotating conic halo.
export function CrownEmblem({ size = 88 }) {
    return (
        <span className="relative grid shrink-0 place-items-center" style={{ height: size, width: size }}>
            <span
                className="ol-spin-slow absolute inset-0 rounded-full"
                style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(251,215,116,0.65) 70deg, transparent 150deg, transparent 360deg)" }}
            />
            <span className="absolute inset-[4px] rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-lg shadow-amber-900/40" />
            <span className="absolute inset-[4px] rounded-full ring-1 ring-inset ring-white/40" />
            <Crown className="relative text-white drop-shadow" style={{ height: size * 0.42, width: size * 0.42 }} fill="currentColor" />
        </span>
    );
}

// The premium dashboard welcome — a warm espresso-and-gold "membership card"
// that replaces the standard blue hero for pro students.
export function PremiumWelcome({ user, streak = 0 }) {
    const firstName = (user?.name || "there").split(" ")[0];
    const supportMsg = `Hi OneLeet team, I'm ${user?.name || "a premium student"} (from my dashboard) and need some help with my preparation.`;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="ol-shimmer relative h-full overflow-hidden rounded-2xl p-6 text-white shadow-xl ring-1 ring-amber-300/30 sm:p-7"
            style={{ background: "radial-gradient(135% 120% at 0% 0%, #3c2b12 0%, #241705 46%, #150c02 100%)" }}
        >
            <PremiumAura />
            <Sparkles />
            {/* gold hairline along the top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

            <div className="relative z-[2] flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 backdrop-blur">
                        <Crown size={12} className="text-amber-300" fill="currentColor" /> Premium Member
                    </span>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                        Welcome back, <span className="ol-gold-text">{firstName}</span>
                    </h1>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-amber-100/80">
                        {streak > 0
                            ? `Your ${streak}-day streak is glowing. Every topper stood exactly where you are now — keep the momentum and make it count.`
                            : "Your full library is unlocked — every mock, note, PYQ and AI tool, plus priority mentor support. Let's build today's streak."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            to="/pyqs"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-sm font-bold text-amber-950 shadow-lg shadow-amber-900/30 transition hover:brightness-105"
                        >
                            <Play size={15} /> Start practice
                        </Link>
                        <a
                            href={whatsappLink(supportMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 backdrop-blur transition hover:bg-amber-300/10"
                        >
                            <Headphones size={15} /> Priority support
                        </a>
                    </div>
                </div>
                <CrownEmblem size={92} />
            </div>
        </motion.div>
    );
}

// The "what your membership gives you" strip — reinforces the value right under
// the hero. Warm gold cards, staggered in.
const PERKS = [
    { icon: Unlock, label: "Everything unlocked", sub: "All mocks, notes & PYQs" },
    { icon: Headphones, label: "Priority support", sub: `WhatsApp · ${WHATSAPP_RESPONSE}` },
    { icon: Brain, label: "AI tools & analytics", sub: "Personalised coaching" },
    { icon: Trophy, label: "Ranked mocks", sub: "Live leaderboards" },
];
export function PremiumPerks() {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PERKS.map((p, i) => {
                const Icon = p.icon;
                return (
                    <motion.div
                        key={p.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.12 + i * 0.07, ease: "easeOut" }}
                        className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-3.5 transition hover:shadow-md hover:shadow-amber-200/40 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-transparent"
                    >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30">
                            <Icon size={17} />
                        </span>
                        <p className="mt-2.5 text-sm font-bold text-slate-800 dark:text-slate-100">{p.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.sub}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

// A compact "Premium" pill (crown + gold gradient) for the member themself —
// distinct from PremiumBadge, which marks locked/premium *content*.
export function PremiumMemberPill({ className = "" }) {
    return (
        <span
            className={
                "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-amber-500/30 " +
                className
            }
        >
            <Crown className="h-3 w-3" fill="currentColor" /> Premium
        </span>
    );
}

// Gilds a user avatar for premium members: a gold gradient ring + a small crown
// badge. Falls back to the plain avatar/initial for everyone else.
export function PremiumAvatar({ user, size = 36, premium = false }) {
    const inner = user?.avatar ? (
        <img src={user.avatar} alt={user.name || "You"} className="h-full w-full rounded-full object-cover" />
    ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {(user?.name || "U").charAt(0).toUpperCase()}
        </span>
    );
    if (!premium) {
        return (
            <span className="block shrink-0 overflow-hidden rounded-full" style={{ height: size, width: size }}>
                {inner}
            </span>
        );
    }
    return (
        <span className="relative block shrink-0" style={{ height: size, width: size }}>
            <span className="block h-full w-full rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-[2px] shadow-sm shadow-amber-500/30">
                <span className="block h-full w-full rounded-full bg-white p-[1.5px] dark:bg-slate-900">
                    <span className="block h-full w-full overflow-hidden rounded-full">{inner}</span>
                </span>
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-[42%] w-[42%] min-h-[15px] min-w-[15px] place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white dark:ring-slate-900">
                <Crown className="h-[55%] w-[55%] text-white" fill="currentColor" />
            </span>
        </span>
    );
}

// Re-export a spark icon in case a caller wants the lucide one inline.
export { SparkIcon };
