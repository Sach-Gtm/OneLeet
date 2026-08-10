import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Crown, Play, Headphones, Unlock, Brain, Trophy, Sparkles as SparkIcon } from "lucide-react";
import { whatsappLink, WHATSAPP_RESPONSE } from "@/config/support";

// The premium (pro) visual world: a deep "aurora summit" night. A rich
// indigo/violet sky with drifting aurora ribbons, twinkling stars and the
// occasional shooting star, above a mountain range whose summit carries a
// glowing beacon: the climb every topper finished. The accent language is
// platinum and aurora (silver foil, violet/indigo/cyan) - no gold anywhere,
// by request: a black-card feel rather than a gold-card one.
//
// Everything here is decorative and pointer-safe; ambient motion is CSS (see
// index.css, all guarded by prefers-reduced-motion) and entrance motion is
// framer-motion. Reused across the dashboard and any page that wants to feel
// first-class.

// Soft aurora glow fields behind the hero content. Host needs
// `relative overflow-hidden`.
export function PremiumAura() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="ol-aurora absolute -left-1/4 -top-1/2 h-[170%] w-3/4 rounded-full bg-gradient-to-br from-purple-500/30 via-blue-400/15 to-transparent blur-3xl" />
            {/* second glow field rests on phones: fewer simultaneous movers */}
            <div
                className="ol-aurora absolute -right-1/4 -top-1/3 hidden h-[150%] w-2/3 rounded-full bg-gradient-to-bl from-teal-400/25 via-cyan-500/10 to-transparent blur-3xl sm:block"
                style={{ animationDelay: "-7s" }}
            />
            <div className="ol-glow absolute right-16 top-4 h-36 w-36 rounded-full bg-cyan-300/15 blur-2xl" />
        </div>
    );
}

// Fixed star positions (no RNG, so nothing churns between renders). Mostly
// scattered across the top and right so the left-side copy stays clean.
const STARS = [
    { top: "10%", left: "8%", s: 2 },
    { top: "6%", left: "23%", s: 2 },
    { top: "17%", left: "38%", s: 2 },
    { top: "8%", left: "55%", s: 3 },
    { top: "13%", left: "72%", s: 2 },
    { top: "22%", left: "87%", s: 2 },
    { top: "31%", left: "64%", s: 2 },
    { top: "27%", left: "47%", s: 2 },
    { top: "41%", left: "91%", s: 3 },
    { top: "48%", left: "76%", s: 2 },
    { top: "38%", left: "30%", s: 2 },
    { top: "57%", left: "58%", s: 2 },
];

// Four-point ice sparkles that drift, plus the twinkling starfield and two
// shooting stars. All positions are fixed.
const SPARKS = [
    { top: "18%", left: "12%", size: 10, dur: "5.4s", delay: "0s" },
    { top: "24%", left: "82%", size: 7, dur: "6.6s", delay: "-1.4s", desktopOnly: true },
    { top: "58%", left: "22%", size: 8, dur: "5.8s", delay: "-2.1s" },
    { top: "64%", left: "68%", size: 11, dur: "7s", delay: "-0.7s" },
    { top: "40%", left: "52%", size: 6, dur: "6s", delay: "-3s", desktopOnly: true },
];
export function Sparkles() {
    return (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {STARS.map((st, i) => (
                <span
                    key={`star-${i}`}
                    className="ol-twinkle absolute rounded-full bg-white"
                    style={{
                        top: st.top,
                        left: st.left,
                        height: st.s,
                        width: st.s,
                        "--ol-tw-dur": `${3.2 + i * 0.35}s`,
                        "--ol-tw-delay": `${-i * 0.7}s`,
                    }}
                />
            ))}
            {SPARKS.map((s, i) => (
                <span
                    key={`spark-${i}`}
                    className={`ol-float absolute text-indigo-200 drop-shadow-[0_0_5px_rgba(165,180,252,0.7)] ${s.desktopOnly ? "hidden sm:block" : ""}`}
                    style={{ top: s.top, left: s.left, "--ol-float-dur": s.dur, animationDelay: s.delay }}
                >
                    <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0l2.4 8.4L22 12l-7.6 3.6L12 24l-2.4-8.4L2 12l7.6-3.6z" />
                    </svg>
                </span>
            ))}
            {/* shooting stars: bright head, fading tail, long quiet gaps */}
            <span className="ol-shoot absolute left-[6%] top-[10%] h-px w-16 bg-gradient-to-r from-transparent via-slate-100/70 to-white opacity-0" />
            <span
                className="ol-shoot absolute left-[52%] top-[6%] hidden h-px w-12 bg-gradient-to-r from-transparent via-indigo-100/70 to-white opacity-0 sm:block"
                style={{ "--ol-shoot-delay": "6.5s", "--ol-shoot-dur": "13s" }}
            />
        </div>
    );
}

// The aurora curtains: two blurred gradient ribbons swaying across the sky.
// Perf: the blur is CSS on the (static) svg so it rasterizes once; the sway
// animates `transform` on the wrapper div, so frames are pure compositing.
// The second ribbon sits out on phones (less simultaneous motion).
function AuroraRibbons() {
    return (
        <>
            <div className="ol-ribbon pointer-events-none absolute inset-x-0 top-0 h-3/5" aria-hidden="true">
                <svg className="h-full w-full" viewBox="0 0 900 200" preserveAspectRatio="none" style={{ filter: "blur(13px)" }}>
                    <defs>
                        <linearGradient id="olRibbonA" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#2dd4bf" stopOpacity="0" />
                            <stop offset="0.3" stopColor="#2dd4bf" stopOpacity="0.5" />
                            <stop offset="0.65" stopColor="#a78bfa" stopOpacity="0.45" />
                            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M-40 78 C 140 18, 330 128, 540 66 S 860 96, 960 30"
                        fill="none"
                        stroke="url(#olRibbonA)"
                        strokeWidth="34"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <div
                className="ol-ribbon pointer-events-none absolute inset-x-0 top-[8%] hidden h-3/5 sm:block"
                style={{ animationDelay: "-6s" }}
                aria-hidden="true"
            >
                <svg className="h-full w-full" viewBox="0 0 900 200" preserveAspectRatio="none" style={{ filter: "blur(11px)" }}>
                    <defs>
                        <linearGradient id="olRibbonB" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#f0abfc" stopOpacity="0" />
                            <stop offset="0.4" stopColor="#f0abfc" stopOpacity="0.35" />
                            <stop offset="0.75" stopColor="#67e8f9" stopOpacity="0.4" />
                            <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M-60 140 C 180 90, 400 178, 620 110 S 880 150, 980 96"
                        fill="none"
                        stroke="url(#olRibbonB)"
                        strokeWidth="26"
                        strokeLinecap="round"
                        opacity="0.9"
                    />
                </svg>
            </div>
        </>
    );
}

// The mountain range along the bottom of the hero: a moonlit back range, a
// darker front range, a dotted climbing trail and a pulsing ice beacon + flag
// on the summit. The quiet story: the top is a place you can reach.
function SummitScene() {
    return (
        <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full sm:h-28"
            viewBox="0 0 900 160"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="olPeakBack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#37337f" />
                    <stop offset="1" stopColor="#181a4b" />
                </linearGradient>
                <linearGradient id="olPeakFront" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#232065" />
                    <stop offset="1" stopColor="#0b0d2b" />
                </linearGradient>
                {/* soft beacon halo as a gradient fill: no filter, so the pulse
                    only ever animates opacity (compositor-cheap) */}
                <radialGradient id="olBeacon" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#a5f3fc" stopOpacity="0.65" />
                    <stop offset="0.5" stopColor="#a5f3fc" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#a5f3fc" stopOpacity="0" />
                </radialGradient>
            </defs>
            <path
                d="M0 160 L0 92 L120 52 L230 102 L360 40 L500 98 L640 30 L770 88 L900 58 L900 160 Z"
                fill="url(#olPeakBack)"
                opacity="0.55"
            />
            <path
                d="M0 160 L0 118 L150 76 L300 122 L470 54 L640 120 L780 88 L900 108 L900 160 Z"
                fill="url(#olPeakFront)"
            />
            {/* the dotted trail up to the summit */}
            <path
                d="M60 152 C 180 140, 260 128, 340 106 S 445 72, 468 58"
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="2"
                strokeDasharray="0.5 9"
                strokeLinecap="round"
                opacity="0.85"
            />
            {/* summit beacon + flag */}
            <circle className="ol-pulse" cx="470" cy="52" r="14" fill="url(#olBeacon)" />
            <circle cx="470" cy="52" r="2.4" fill="#ffffff" />
            <path d="M470 50 L470 34 L484 39 L470 44" fill="#a78bfa" stroke="#a78bfa" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
    );
}

// The crown emblem: a royal-violet planet with a slowly rotating conic halo, a faint
// tilted ring and a spark orbiting it. Gently floats.
export function CrownEmblem({ size = 88 }) {
    return (
        <span
            className="ol-float relative grid shrink-0 place-items-center"
            style={{ height: size, width: size, "--ol-float-dur": "7s" }}
        >
            <span
                className="ol-spin-slow absolute inset-0 rounded-full"
                style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(196,181,253,0.55) 70deg, transparent 150deg, transparent 360deg)" }}
            />
            <span className="absolute inset-[4px] rounded-full bg-gradient-to-br from-sky-400 via-purple-500 to-purple-800 shadow-lg shadow-indigo-950/60" />
            <span className="absolute inset-[4px] rounded-full ring-1 ring-inset ring-white/40" />
            {/* planet ring */}
            <span
                className="absolute left-1/2 top-1/2 h-[46%] w-[140%] rounded-[50%] border border-purple-200/40"
                style={{ transform: "translate(-50%, -50%) rotate(-16deg)" }}
            />
            {/* orbiting spark */}
            <span className="ol-orbit absolute -inset-2.5 rounded-full">
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_3px_rgba(167,139,252,0.65)]" />
            </span>
            <Crown className="relative text-white drop-shadow" style={{ height: size * 0.42, width: size * 0.42 }} fill="currentColor" />
        </span>
    );
}

// The premium dashboard welcome: the aurora-summit night card that replaces the
// standard blue hero for pro students.
export function PremiumWelcome({ user, streak = 0 }) {
    const firstName = (user?.name || "there").split(" ")[0];
    const supportMsg = `Hi OneLeet team, I'm ${user?.name || "a premium student"} (from my dashboard) and need some help with my preparation.`;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="ol-shimmer relative h-full overflow-hidden rounded-2xl p-6 pb-16 text-white shadow-xl ring-1 ring-purple-400/25 sm:p-7 sm:pb-16"
            style={{
                background:
                    "radial-gradient(120% 140% at 15% -10%, #312e81 0%, #1e1b4b 34%, #131240 62%, #070a23 100%)",
            }}
        >
            <PremiumAura />
            <AuroraRibbons />
            <Sparkles />
            <SummitScene />
            {/* aurora hairline along the top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-purple-300/70 to-transparent" />

            <div className="relative z-[2] flex flex-wrap items-center justify-between gap-5">
                <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-100 backdrop-blur">
                        <Crown size={12} className="text-slate-200" fill="currentColor" /> Premium Member
                    </span>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                        Welcome back, <span className="ol-foil-text">{firstName}</span>
                    </h1>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-100/85">
                        {streak > 0
                            ? `Your ${streak}-day streak is glowing. Every topper stood exactly where you are now. Keep climbing.`
                            : "Your full library is unlocked: every mock, note, PYQ and AI tool, plus priority mentor support. Let's build today's streak."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            to="/pyqs"
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-950 shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-50"
                        >
                            <Play size={15} /> Start practice
                        </Link>
                        <a
                            href={whatsappLink(supportMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-indigo-50 backdrop-blur transition hover:bg-white/10"
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

// The "what your membership gives you" strip: deep-night glass cards with a
// slowly panning aurora border, each perk with its own aurora hue. Staggered in.
const PERKS = [
    {
        icon: Unlock,
        label: "Everything unlocked",
        sub: "All mocks, notes & PYQs",
        orb: "from-blue-400 to-blue-600",
        glow: "rgba(96,165,250,0.38)",
    },
    {
        icon: Headphones,
        label: "Priority support",
        sub: `WhatsApp · ${WHATSAPP_RESPONSE}`,
        orb: "from-cyan-300 to-sky-500",
        glow: "rgba(103,232,249,0.32)",
    },
    {
        icon: Brain,
        label: "AI tools & analytics",
        sub: "Personalised coaching",
        orb: "from-fuchsia-400 to-purple-500",
        glow: "rgba(232,121,249,0.34)",
    },
    {
        icon: Trophy,
        label: "Ranked mocks",
        sub: "Live leaderboards",
        orb: "from-rose-400 to-pink-500",
        glow: "rgba(244,114,182,0.32)",
    },
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
                        whileHover={{ y: -4, transition: { duration: 0.2, delay: 0 } }}
                        transition={{ duration: 0.4, delay: 0.12 + i * 0.07, ease: "easeOut" }}
                        className="ol-glass-card group rounded-2xl transition-shadow duration-300 hover:shadow-lg hover:shadow-indigo-950/40"
                    >
                        <div className="ol-glass-inner p-3.5">
                            {/* hue glow leaking in from the corner */}
                            <span
                                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                                style={{ background: p.glow }}
                            />
                            <span
                                className="ol-twinkle absolute right-3 top-3 h-1 w-1 rounded-full bg-white"
                                style={{ "--ol-tw-delay": `${-i * 0.9}s` }}
                            />
                            <span
                                className={`relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${p.orb} text-white shadow-md shadow-indigo-950/40`}
                            >
                                <Icon size={17} />
                            </span>
                            <p className="relative mt-2.5 text-sm font-bold text-white">{p.label}</p>
                            <p className="relative text-[11px] text-indigo-100/75">{p.sub}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// A compact "Premium" pill (violet-ringed platinum chip) for the member themself,
// distinct from PremiumBadge, which marks locked/premium *content*.
export function PremiumMemberPill({ className = "" }) {
    return (
        <span
            className={
                "inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-200 shadow-sm ring-1 ring-inset ring-purple-400/60 dark:bg-slate-950 " +
                className
            }
        >
            <Crown className="h-3 w-3" fill="currentColor" /> Premium
        </span>
    );
}

// Rings a premium member's avatar in the aurora gradient + a small crown
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
            <span className="block h-full w-full rounded-full bg-gradient-to-br from-sky-400 via-purple-400 to-fuchsia-400 p-[2px] shadow-sm shadow-purple-500/30">
                <span className="block h-full w-full rounded-full bg-white p-[1.5px] dark:bg-slate-900">
                    <span className="block h-full w-full overflow-hidden rounded-full">{inner}</span>
                </span>
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-[42%] w-[42%] min-h-[15px] min-w-[15px] place-items-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-white dark:ring-slate-900">
                <Crown className="h-[55%] w-[55%] text-white" fill="currentColor" />
            </span>
        </span>
    );
}

// Re-export a spark icon in case a caller wants the lucide one inline.
export { SparkIcon };
