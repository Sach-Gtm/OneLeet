import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Google-Doodle-style celebration overlay: a themed animated emoji "doodle",
// a confetti burst and a message, shown on a milestone (streak comeback, top-3
// rank, subject finished, batch joined, went Premium). Auto-dismisses; tap to
// close. Confetti + big motion are skipped under prefers-reduced-motion.

const THEMES = {
    streak: {
        emoji: "🔥",
        wrap: "from-orange-500 via-amber-500 to-rose-500",
        ring: "#fb923c",
        title: () => "You're on a roll!",
        sub: (o) => `${o?.streak ? `${o.streak}-day streak — ` : ""}welcome back. Let's keep it running!`,
        motionEmoji: { y: [0, -14, 0], rotate: [0, -6, 6, 0] },
    },
    rank: {
        emoji: "🏆",
        wrap: "from-amber-400 via-yellow-500 to-orange-500",
        ring: "#f59e0b",
        title: (o) => `Rank #${o?.rank ?? "top 3"} — podium finish!`,
        sub: () => "Top 3 in a live test. That's seriously impressive.",
        motionEmoji: { rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] },
    },
    syllabus: {
        emoji: "🎓",
        wrap: "from-emerald-500 via-teal-500 to-cyan-500",
        ring: "#10b981",
        title: () => "Subject complete!",
        sub: (o) => `You finished ${o?.subject || "a whole subject"}. One big step closer.`,
        motionEmoji: { y: [0, -12, 0], rotate: [0, 8, -8, 0] },
    },
    course: {
        emoji: "🎉",
        wrap: "from-indigo-500 via-violet-500 to-fuchsia-500",
        ring: "#8b5cf6",
        title: () => "You're in!",
        sub: (o) => `Welcome to ${o?.name || "your batch"}. Let's crack it together.`,
        motionEmoji: { rotate: [0, -14, 14, 0], y: [0, -10, 0] },
    },
    premium: {
        emoji: "👑",
        wrap: "from-amber-400 via-orange-500 to-rose-500",
        ring: "#f59e0b",
        title: () => "Welcome to Premium!",
        sub: () => "Everything's unlocked — your full prep starts now.",
        motionEmoji: { y: [0, -14, 0], scale: [1, 1.12, 1] },
    },
};

const CONFETTI = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#38bdf8", "#fb7185"];

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Deterministic pseudo-random scatter (pure — Math.sin/floor only), so the burst
// can be built in render without an impure Math.random. Looks random enough.
const scatter = (i, s) => {
    const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
    return x - Math.floor(x);
};

function Confetti() {
    const pieces = useMemo(
        () =>
            Array.from({ length: 46 }, (_, i) => ({
                id: i,
                x: (scatter(i, 1) * 2 - 1) * 280,
                y: -(scatter(i, 2) * 240 + 80),
                rot: scatter(i, 3) * 540 - 270,
                delay: scatter(i, 4) * 0.18,
                color: CONFETTI[i % CONFETTI.length],
                size: 6 + scatter(i, 5) * 7,
                round: scatter(i, 6) > 0.6,
            })),
        []
    );
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/2 top-[42%]">
                {pieces.map((p) => (
                    <motion.span
                        key={p.id}
                        initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                        animate={{ x: p.x, y: [0, p.y, p.y + 460], opacity: [1, 1, 0], rotate: p.rot }}
                        transition={{ duration: 1.9, delay: p.delay, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            width: p.size,
                            height: p.round ? p.size : p.size * 0.5,
                            borderRadius: p.round ? "9999px" : "2px",
                            background: p.color,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function CelebrationOverlay({ celebration, onClose }) {
    const timer = useRef(null);
    const reduced = prefersReducedMotion();

    useEffect(() => {
        if (!celebration) return undefined;
        timer.current = window.setTimeout(onClose, 4600);
        return () => window.clearTimeout(timer.current);
    }, [celebration, onClose]);

    const theme = celebration ? THEMES[celebration.type] || THEMES.course : null;
    const opts = celebration?.opts || {};

    return (
        <AnimatePresence>
            {celebration && theme && (
                <motion.div
                    key={celebration.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-live="polite"
                >
                    {!reduced && <Confetti />}

                    <motion.div
                        initial={reduced ? { opacity: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900"
                    >
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                            <X size={16} />
                        </button>

                        {/* Doodle: gradient orb + pulsing rings + the animated emoji. */}
                        <div className="relative mx-auto grid h-28 w-28 place-items-center">
                            <span
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.wrap} opacity-90`}
                                style={{ filter: "blur(2px)" }}
                            />
                            {!reduced &&
                                [0, 1].map((r) => (
                                    <motion.span
                                        key={r}
                                        className="absolute inset-0 rounded-full border-2"
                                        style={{ borderColor: theme.ring }}
                                        initial={{ scale: 0.7, opacity: 0.6 }}
                                        animate={{ scale: 1.9, opacity: 0 }}
                                        transition={{ duration: 1.8, repeat: Infinity, delay: r * 0.9, ease: "easeOut" }}
                                    />
                                ))}
                            <motion.span
                                className="relative text-5xl"
                                animate={reduced ? undefined : theme.motionEmoji}
                                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
                            >
                                {theme.emoji}
                            </motion.span>
                        </div>

                        <h2 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                            {typeof theme.title === "function" ? theme.title(opts) : theme.title}
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                            {typeof theme.sub === "function" ? theme.sub(opts) : theme.sub}
                        </p>

                        <button
                            onClick={onClose}
                            className={`mt-6 w-full rounded-xl bg-gradient-to-r ${theme.wrap} py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            {opts?.cta || "Let's go!"}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
