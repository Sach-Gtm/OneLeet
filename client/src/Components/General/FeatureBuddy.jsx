// The home features scene: a friendly OneLeet robot buddy (white round-bot in
// a graduation cap, waving) surrounded by the feature tiles, under a soft
// daytime sky with drifting clouds. Pure SVG + CSS, no images and no
// framer-motion (this renders in the landing entry chunk, which deliberately
// stays light). All motion is transform/opacity keyframes in index.css,
// guarded by prefers-reduced-motion.

// A puffy cloud built from three overlapping rounded spans; the wrapper drifts
// gently side to side (transform only). Softly blurred once, then composited.
export function Cloud({ className = "", dur = "36s", delay = "0s" }) {
    return (
        <div
            aria-hidden="true"
            className={`ol-cloud pointer-events-none absolute ${className}`}
            style={{ "--ol-cloud-dur": dur, animationDelay: delay }}
        >
            <div className="relative h-10 w-full">
                <span className="absolute bottom-0 left-0 h-6 w-3/5 rounded-full bg-white/90 blur-[2px] dark:bg-slate-700/40" />
                <span className="absolute bottom-0 right-0 h-7 w-1/2 rounded-full bg-white/90 blur-[2px] dark:bg-slate-700/40" />
                <span className="absolute bottom-1 left-1/4 h-9 w-2/5 rounded-full bg-white blur-[2px] dark:bg-slate-700/50" />
            </div>
        </div>
    );
}

// A short dashed connector line whose dashes march slowly toward the robot.
// Desktop only (the caller hides it below lg).
export function Connector({ side = "right", className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 h-1 w-12 -translate-y-1/2 text-slate-300 dark:text-slate-600 ${
                side === "right" ? "-right-14" : "-left-14"
            } ${className}`}
            viewBox="0 0 48 4"
        >
            <line
                x1="0"
                y1="2"
                x2="48"
                y2="2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 5"
                className={side === "right" ? "ol-dash" : "ol-dash-rev"}
            />
        </svg>
    );
}

// The OneLeet buddy: hand-drawn SVG mascot. Floats as a whole; the raised arm
// waves, the eyes blink, the cap tassel and chest spark stay still. Everything
// animated is a transform on an SVG group (transform-box: fill-box in CSS).
export function RobotBuddy({ className = "" }) {
    return (
        <div className={`ol-float ${className}`} style={{ "--ol-float-dur": "6s" }} aria-hidden="true">
            <svg viewBox="0 0 200 240" className="h-auto w-full drop-shadow-sm">
                {/* ground shadow */}
                <ellipse cx="100" cy="228" rx="46" ry="8" fill="rgba(100,116,139,0.22)" />

                {/* ball base */}
                <circle cx="100" cy="196" r="26" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                <ellipse cx="92" cy="188" rx="8" ry="5" fill="#f1f5f9" />

                {/* waving arm (raised clear of the head, viewer right) */}
                <g className="ol-wave">
                    <rect x="152" y="88" width="16" height="46" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" transform="rotate(-18 160 132)" />
                    <circle cx="168" cy="88" r="7" fill="#e0e7ff" stroke="#cbd5e1" strokeWidth="2" />
                </g>

                {/* resting arm (viewer left) */}
                <rect x="44" y="134" width="16" height="36" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />

                {/* body */}
                <rect x="64" y="118" width="72" height="72" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* chest emblem: indigo tile with a spark */}
                <rect x="89" y="144" width="22" height="22" rx="7" fill="#6366f1" />
                <path
                    d="M100 148.5l1.7 4.6 4.6 1.7-4.6 1.7-1.7 4.6-1.7-4.6-4.6-1.7 4.6-1.7z"
                    fill="#ffffff"
                />

                {/* head */}
                <rect x="52" y="34" width="96" height="76" rx="26" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* face screen */}
                <rect x="64" y="48" width="72" height="48" rx="16" fill="#0f172a" />
                {/* happy eyes (blink together) */}
                <g className="ol-blink" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round">
                    <path d="M78 75 Q85 65 92 75" />
                    <path d="M108 75 Q115 65 122 75" />
                </g>
                {/* cheeks */}
                <circle cx="70" cy="102" r="4.5" fill="#fecdd3" />
                <circle cx="130" cy="102" r="4.5" fill="#fecdd3" />

                {/* graduation cap */}
                <path d="M100 6 L154 25 L100 44 L46 25 Z" fill="#1e293b" />
                <path d="M78 33 v10 a22 10 0 0 0 44 0 v-10" fill="#1e293b" />
                {/* tassel (indigo, per the no-gold rule) */}
                <line x1="154" y1="25" x2="158" y2="46" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="158" cy="49" r="3.5" fill="#818cf8" />
            </svg>
        </div>
    );
}
