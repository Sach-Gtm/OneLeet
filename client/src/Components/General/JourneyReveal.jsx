import { motion } from "framer-motion";

// A narrative SVG: the road a diploma student actually travels —
//   10th  →  Diploma  →  B.Tech (via LEET)  →  networking + opportunity
// — ending in a row of gates that swing open, one after another, to reveal the
// kind of companies that then come within reach. Brand indigo/violet frames the
// journey; the logos keep their own colours. Framed as ASPIRATION ("where it can
// take you"), never as a placement claim. Plays once on mount, holds, and
// replays whenever the landing is revisited.

// --- simplified, recognisable brand marks (24x24 local coords) --------------
const MARKS = {
    Google: (
        <>
            <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.84h3.86c2.26-2.09 3.59-5.17 3.59-8.66z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.96-2.91l-3.86-2.84c-1.08.72-2.45 1.16-4.1 1.16-3.13 0-5.78-2.11-6.73-4.96H1.4v3.13A11.997 11.997 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29a7.8 7.8 0 0 1 0-4.58V6.58H1.4a12.02 12.02 0 0 0 0 10.84z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.4 6.58l3.87 3.13C6.22 6.86 8.87 4.75 12 4.75z" />
        </>
    ),
    Microsoft: (
        <>
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
            <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
        </>
    ),
    Amazon: (
        <>
            <text x="12" y="13" textAnchor="middle" fontSize="15" fontWeight="800" fill="#232F3E">a</text>
            <path d="M4.5 16.5c4.7 3.3 10.6 3.3 15 .2" fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M19.5 16.7c.7-.4 1.1-1.3 1.1-2.4" fill="none" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" />
        </>
    ),
    Apple: (
        <path fill="#111827" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    ),
    Netflix: (
        <g fill="#E50914">
            <rect x="6" y="2" width="3.6" height="20" />
            <rect x="14.4" y="2" width="3.6" height="20" />
            <polygon points="6,2 9.6,2 18,22 14.4,22" />
        </g>
    ),
    Meta: (
        <path
            d="M2 12c0-2.9 1.7-5 4.1-5 3 0 4.9 5 5.9 5s2.9-5 5.9-5c2.4 0 4.1 2.1 4.1 5s-1.7 5-4.1 5c-3 0-4.9-5-5.9-5s-2.9 5-5.9 5C3.7 17 2 14.9 2 12z"
            fill="none" stroke="url(#metaGrad)" strokeWidth="2.4"
        />
    ),
};

const COMPANIES = ["Google", "Microsoft", "Amazon", "Apple", "Netflix", "Meta"];

// gate geometry
const X0 = 40;
const GAP = 16;
const GATE_W = 140;
const STRIDE = GATE_W + GAP; // 156
const GATE_Y = 185;
const GATE_H = 150;
const gx = (i) => X0 + i * STRIDE;

// timeline nodes (rising left→right)
const NODES = [
    { label: "10th", x: 130, y: 105, r: 9 },
    { label: "Diploma", x: 400, y: 82, r: 10 },
    { label: "B.Tech", x: 670, y: 58, r: 16, big: true },
];

const GATE_START = 2.2;
const centered = { transformBox: "fill-box", transformOrigin: "center" };

export default function JourneyReveal({ className = "" }) {
    return (
        <svg viewBox="0 0 1000 400" className={className} role="img"
            aria-label="A diploma student's journey: 10th to Diploma to B.Tech, then doors opening to top companies">
            <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#4f46e5" />
                    <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
                <linearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
                <linearGradient id="metaGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#0064e0" />
                    <stop offset="1" stopColor="#00a1ff" />
                </linearGradient>
                <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3.2" />
                </filter>
            </defs>

            {/* ---- fan-out: networking / opportunity spreading from B.Tech ---- */}
            {COMPANIES.map((_, i) => {
                const tx = gx(i) + GATE_W / 2;
                const d = `M670 66 C 670 130, ${tx} 110, ${tx} ${GATE_Y - 6}`;
                return (
                    <motion.path
                        key={`fan-${i}`}
                        d={d}
                        fill="none"
                        stroke="url(#brandGrad)"
                        strokeWidth="1.6"
                        strokeOpacity="0.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 1.35 + i * 0.05, duration: 0.55, ease: "easeOut" }}
                    />
                );
            })}

            {/* ---- timeline connectors ---- */}
            <motion.line
                x1="139" y1="102" x2="391" y2="85"
                stroke="url(#brandGrad)" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
            />
            <motion.line
                x1="409" y1="79" x2="655" y2="62"
                stroke="url(#brandGrad)" strokeWidth="3" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
            />

            {/* ---- timeline nodes + labels ---- */}
            {NODES.map((n, i) => (
                <motion.g
                    key={n.label}
                    style={centered}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.45, type: "spring", stiffness: 260, damping: 16 }}
                >
                    {n.big && <circle cx={n.x} cy={n.y} r={n.r + 7} fill="url(#brandGrad)" opacity="0.25" filter="url(#soft)" />}
                    <circle cx={n.x} cy={n.y} r={n.r} fill={n.big ? "url(#brandGrad)" : "#fff"} stroke="url(#brandGrad)" strokeWidth={n.big ? 0 : 3} />
                    {n.big && <circle cx={n.x} cy={n.y} r="5" fill="#fff" opacity="0.9" />}
                    <text
                        x={n.x} y={n.y - n.r - 12} textAnchor="middle"
                        fontSize={n.big ? 22 : 17} fontWeight={n.big ? 800 : 600}
                        fill={n.big ? "#4f46e5" : "#334155"}
                    >
                        {n.label}
                    </text>
                </motion.g>
            ))}

            {/* travelling pulse along the road */}
            <motion.circle
                r="6" fill="#7c3aed"
                initial={{ cx: 130, cy: 105, opacity: 0 }}
                animate={{ cx: [130, 400, 670], cy: [105, 82, 58], opacity: [0, 1, 1, 0] }}
                transition={{ delay: 0.3, duration: 1.15, times: [0, 0.45, 0.9, 1], ease: "easeInOut" }}
            />

            {/* networking · opportunity waypoint chip (on top of the fans) */}
            <motion.g
                style={centered}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.9, duration: 0.4 }}
            >
                <rect x="566" y="120" width="208" height="30" rx="15" fill="#fff" stroke="#e0e7ff" strokeWidth="1.5" />
                <text x="670" y="140" textAnchor="middle" fontSize="15" fontWeight="600" fill="#6d28d9">
                    networking + opportunity
                </text>
            </motion.g>

            {/* ---- the gates ---- */}
            {COMPANIES.map((name, i) => {
                const x = gx(i);
                const half = GATE_W / 2;
                const cx = x + half;
                const open = { delay: GATE_START + i * 0.13, duration: 0.6, ease: [0.7, 0, 0.3, 1] };
                return (
                    <g key={name}>
                        {/* revealed chip behind the doors */}
                        <rect x={x} y={GATE_Y} width={GATE_W} height={GATE_H} rx="14" fill="#fff" />
                        <motion.g
                            style={centered}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: GATE_START + i * 0.13 + 0.32, duration: 0.4 }}
                        >
                            <g transform={`translate(${cx - 25}, ${GATE_Y + 34}) scale(2.1)`}>{MARKS[name]}</g>
                            <text x={cx} y={GATE_Y + GATE_H - 22} textAnchor="middle" fontSize="17" fontWeight="700" fill="#1e293b">
                                {name}
                            </text>
                        </motion.g>

                        {/* two doors that part from the centre */}
                        <motion.rect
                            x={x} y={GATE_Y} width={half} height={GATE_H} rx="12"
                            fill="url(#doorGrad)"
                            initial={{ width: half }} animate={{ width: 0 }} transition={open}
                        />
                        <motion.rect
                            y={GATE_Y} height={GATE_H} rx="12"
                            fill="url(#doorGrad)"
                            initial={{ x: x + half, width: half }} animate={{ x: x + GATE_W, width: 0 }} transition={open}
                        />

                        {/* door frame stays put */}
                        <rect x={x} y={GATE_Y} width={GATE_W} height={GATE_H} rx="14" fill="none" stroke="url(#brandGrad)" strokeWidth="2.5" />
                    </g>
                );
            })}
        </svg>
    );
}
