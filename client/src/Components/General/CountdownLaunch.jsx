import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Clock } from "lucide-react";
import { LAUNCH_TS, hasLaunched } from "@/config/launch";
import ScholarshipRegisterCard from "./ScholarshipRegisterCard";

const remain = () => Math.max(0, LAUNCH_TS - Date.now());
const parts = (ms) => ({
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
});

// One depleting progress ring with the number in its centre — the gradient
// stroke + soft glow give it depth (vs. a flat block).
function Ring({ value, max, label, gid }) {
    const R = 34;
    const C = 2 * Math.PI * R;
    const frac = Math.max(0, Math.min(1, max ? value / max : 0));
    return (
        <div className="flex flex-col items-center">
            <div className="relative h-[76px] w-[76px] sm:h-24 sm:w-24">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                    <circle cx="40" cy="40" r={R} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-700/70" />
                    <circle
                        cx="40" cy="40" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
                        stroke={`url(#${gid})`}
                        strokeDasharray={C}
                        strokeDashoffset={C * (1 - frac)}
                        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.2,0.7,0.2,1)", filter: `drop-shadow(0 0 5px rgba(124,58,237,0.45))` }}
                    />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                    <span className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                        {String(value).padStart(2, "0")}
                    </span>
                </div>
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</span>
        </div>
    );
}

// Pre-launch view for /pricing: an animated SVG countdown to the early-bird
// price drop, with the free scholarship-test registration right below it. Calls
// onLaunched() the moment the countdown hits zero so /pricing can flip to prices.
export default function CountdownLaunch({ onLaunched }) {
    const gid = useId().replace(/:/g, "");
    const [ms, setMs] = useState(remain());
    // Capture the starting day-count once so the Days ring depletes against it.
    const [maxDays] = useState(() => Math.max(1, parts(remain()).days));

    useEffect(() => {
        const t = setInterval(() => {
            const r = remain();
            setMs(r);
            if (r <= 0 || hasLaunched()) {
                clearInterval(t);
                onLaunched?.();
            }
        }, 1000);
        return () => clearInterval(t);
    }, [onLaunched]);

    const p = parts(ms);

    return (
        <div className="relative mx-auto max-w-3xl overflow-hidden px-4 pb-24 pt-28 sm:pt-32">
            {/* soft floating orbs — depth without flat colour blocks */}
            <motion.span aria-hidden className="pointer-events-none absolute -top-6 left-[8%] -z-10 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl"
                animate={{ y: [0, 26, 0], x: [0, 16, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
            <motion.span aria-hidden className="pointer-events-none absolute top-10 right-[6%] -z-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl"
                animate={{ y: [0, -22, 0], x: [0, -14, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} />

            {/* one gradient shared by every ring */}
            <svg width="0" height="0" className="absolute"><defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="55%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
            </defs></svg>

            <div className="text-center">
                <motion.span
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <Rocket size={13} /> Launching soon
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Early-bird pricing drops soon
                </motion.h1>
                <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                    Our full membership + early-bird offer goes live <b className="text-slate-700 dark:text-slate-200">25 Aug, 10:00 PM</b>.
                    Meanwhile, courses and free batches are open — and so is the scholarship test below.
                </p>
            </div>

            {/* Countdown rings */}
            <div className="mx-auto mt-8 flex max-w-md items-start justify-center gap-3 sm:gap-5">
                <Ring value={p.days} max={maxDays} label="Days" gid={gid} />
                <Ring value={p.hours} max={24} label="Hours" gid={gid} />
                <Ring value={p.minutes} max={60} label="Mins" gid={gid} />
                <Ring value={p.seconds} max={60} label="Secs" gid={gid} />
            </div>

            {/* Scholarship registration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-12"
            >
                <ScholarshipRegisterCard source="pricing" />
            </motion.div>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                <Clock size={13} /> Early-bird prices unlock the moment the countdown ends.
            </p>
        </div>
    );
}
