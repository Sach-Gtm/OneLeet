// Animated course banners: replaces the flat indigo covers on batch cards with
// a small living night scene in the OneLeet aurora language. The exam name
// writes itself on (SVG stroke draw, runs once), an underline sweeps in under
// it, a hue-cast glow drifts and a few stars twinkle. Every course gets its
// own hue, picked deterministically from the label so it never changes between
// visits. All ambient motion is transform/opacity only (see index.css) and
// stops under prefers-reduced-motion, where the name simply shows solid.

const HUES = [
    { cast: "#4f46e5", blob: "rgba(129,140,248,0.5)", ink: "#c7d2fe", under: "from-sky-400 to-blue-500" },
    { cast: "#0e7490", blob: "rgba(34,211,238,0.42)", ink: "#a5f3fc", under: "from-cyan-300 to-sky-400" },
    { cast: "#7c3aed", blob: "rgba(192,132,252,0.45)", ink: "#e9d5ff", under: "from-purple-400 to-fuchsia-400" },
    { cast: "#0f766e", blob: "rgba(45,212,191,0.42)", ink: "#99f6e4", under: "from-teal-300 to-emerald-400" },
    { cast: "#be185d", blob: "rgba(251,113,133,0.42)", ink: "#fecdd3", under: "from-rose-400 to-pink-400" },
];

// Small string hash -> stable hue per label.
export function hueFor(label = "LEET") {
    let h = 0;
    for (let i = 0; i < label.length; i += 1) h = (h * 31 + label.charCodeAt(i)) >>> 0;
    return HUES[h % HUES.length];
}

// The shared night backdrop (gradient + drifting hue glow + twinkles), usable
// under any content. Host needs `relative overflow-hidden`.
export function CourseSky({ hue }) {
    const h = hue || HUES[0];
    return (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(130% 170% at 15% -20%, ${h.cast}b3 0%, #10163a 55%, #070a23 100%)` }}
            />
            <div
                className="ol-aurora absolute -left-1/4 -top-1/2 h-[180%] w-2/3 rounded-full blur-2xl"
                style={{ background: `radial-gradient(closest-side, ${h.blob}, transparent)` }}
            />
            <span className="ol-twinkle absolute left-[14%] top-[24%] h-0.5 w-0.5 rounded-full bg-white" />
            <span className="ol-twinkle absolute right-[16%] top-[30%] h-1 w-1 rounded-full bg-white" style={{ "--ol-tw-delay": "-1.6s" }} />
            <span className="ol-twinkle absolute bottom-[26%] left-[32%] h-0.5 w-0.5 rounded-full bg-white" style={{ "--ol-tw-delay": "-2.8s" }} />
            <span className="ol-twinkle absolute right-[34%] top-[14%] h-0.5 w-0.5 rounded-full bg-white" style={{ "--ol-tw-delay": "-0.9s" }} />
        </div>
    );
}

// The card cover: night backdrop + the exam name writing itself on.
export default function CourseBanner({ label = "LEET", className = "", children }) {
    const hue = hueFor(label);
    const text = String(label).toUpperCase();
    // Scale the type down for long exam names so nothing ever clips.
    const fontSize = Math.min(30, 300 / Math.max(6, text.length * 0.62));
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <CourseSky hue={hue} />
            <svg
                className="pointer-events-none relative h-full w-full"
                viewBox="0 0 340 80"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <text
                    x="170"
                    y="46"
                    textAnchor="middle"
                    className="ol-write"
                    style={{ fontSize, fontWeight: 800, letterSpacing: "0.08em", fill: "#ffffff", stroke: hue.ink }}
                >
                    {text}
                </text>
            </svg>
            <span
                className={`ol-underline pointer-events-none absolute bottom-4 h-0.5 w-16 rounded-full bg-gradient-to-r ${hue.under}`}
                style={{ left: "calc(50% - 2rem)" }}
                aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}
