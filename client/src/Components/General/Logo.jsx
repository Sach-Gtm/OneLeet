import { motion } from "framer-motion";

// OneLeet brand mark: three rising bars (blue → grey → orange growth) topped by
// a briefcase (the career payoff of lateral entry). Recreated as a crisp,
// scalable SVG. When `animated` is set, each bar grows up from the baseline and
// the briefcase drops in with a little bounce on mount — the intro that replays
// every time the page mounts (e.g. login → register), then holds this static
// image. Bars animate their SVG height/y (not a CSS transform) so the growth is
// rock-solid across browsers.
const BASE_Y = 104;
const BAR = [
    { x: 16, w: 18, h: 38, from: "#74CDE8", to: "#4FB2D6" }, // blue (short)
    { x: 44, w: 18, h: 58, from: "#B7B1AA", to: "#918B83" }, // grey (mid)
    { x: 72, w: 18, h: 80, from: "#F59D79", to: "#E9744E" }, // orange (tall)
];
// A springy overshoot so the growth feels alive, not linear.
const POP = [0.34, 1.56, 0.64, 1];

export function LogoMark({ size = 34, animated = false, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 104 112"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <defs>
                {BAR.map((b, i) => (
                    <linearGradient key={i} id={`ol-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={b.from} />
                        <stop offset="100%" stopColor={b.to} />
                    </linearGradient>
                ))}
            </defs>

            {BAR.map((b, i) => {
                const top = BASE_Y - b.h;
                const common = { x: b.x, width: b.w, rx: b.w / 2, fill: `url(#ol-bar-${i})` };
                return animated ? (
                    <motion.rect
                        key={i}
                        {...common}
                        initial={{ height: 0, y: BASE_Y }}
                        animate={{ height: b.h, y: top }}
                        transition={{ duration: 0.7, delay: 0.15 + i * 0.18, ease: POP }}
                    />
                ) : (
                    <rect key={i} {...common} y={top} height={b.h} />
                );
            })}

            {/* Briefcase on the tallest bar */}
            {animated ? (
                <motion.g
                    initial={{ y: -22, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.55, delay: 0.85, ease: POP }}
                >
                    <Briefcase />
                </motion.g>
            ) : (
                <g>
                    <Briefcase />
                </g>
            )}
        </svg>
    );
}

function Briefcase() {
    return (
        <>
            <rect x="67" y="2" width="28" height="9" rx="4" fill="none" stroke="#1F2A3D" strokeWidth="3.4" />
            <rect x="65" y="8" width="32" height="19" rx="4.5" fill="#1F2A3D" />
            <rect x="65" y="14" width="32" height="5" fill="#F5A623" />
            <rect x="76" y="12.5" width="10" height="8" rx="2" fill="#F9A03F" />
        </>
    );
}

// Full lockup: mark + "OneLeet" wordmark (orange "One", blue "Leet").
export default function Logo({ size = 30, animated = false, className = "", textClass = "text-xl" }) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <LogoMark size={size} animated={animated} />
            <span className={`font-extrabold tracking-tight ${textClass}`}>
                <span className="text-[#EC7A54]">One</span>
                <span className="text-[#3FB0D6]">Leet</span>
            </span>
        </span>
    );
}
