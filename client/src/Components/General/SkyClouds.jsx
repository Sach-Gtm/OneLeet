// A soft, realistic sky backdrop: a light-blue gradient (dusk navy in dark
// mode) with a few fluffy white clouds drifting gently across it — the "seems
// real" sky behind the batches. Purely decorative (aria-hidden); the host needs
// `relative` and usually `overflow-hidden`. Motion is transform-only via
// .ol-cloud and stops under prefers-reduced-motion, where the clouds simply
// rest in place.

// One fluffy cloud = a cluster of overlapping soft-white puffs, heavily blurred
// so the edges melt into the sky. In dark mode the puffs go muted blue-grey so
// they read as night clouds instead of bright blobs.
const PUFF = "absolute rounded-full bg-white blur-lg dark:bg-slate-400/20";

function Cloud({ className = "", dur = 48, delay = 0, scale = 1, opacity = 0.9 }) {
    return (
        <div
            className={`ol-cloud absolute ${className}`}
            style={{ "--ol-cloud-dur": `${dur}s`, animationDelay: `${delay}s` }}
        >
            <div className="relative h-16 w-52" style={{ transform: `scale(${scale})`, opacity }}>
                <span className={`${PUFF} bottom-0 left-1/2 h-14 w-44 -translate-x-1/2 blur-xl`} />
                <span className={`${PUFF} bottom-1 left-3 h-14 w-14`} />
                <span className={`${PUFF} bottom-2 left-1/2 h-20 w-24 -translate-x-1/2`} />
                <span className={`${PUFF} bottom-1 right-4 h-16 w-16`} />
            </div>
        </div>
    );
}

export default function SkyClouds({ className = "" }) {
    return (
        <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
            {/* Sky gradient — light day sky, or a dusk/night sky in dark mode.
                Inline styles + a dark: visibility swap keep it robust. */}
            <div
                className="absolute inset-0 dark:hidden"
                style={{ background: "linear-gradient(to bottom, #eaf6fe 0%, #d4ecfb 46%, #bfe2f5 100%)" }}
            />
            <div
                className="absolute inset-0 hidden dark:block"
                style={{ background: "linear-gradient(to bottom, #0b1224 0%, #0e1c37 55%, #122444 100%)" }}
            />

            {/* A soft high sun-glow, like the reference. */}
            <div className="absolute -left-12 -top-20 h-72 w-72 rounded-full bg-white/45 blur-3xl dark:bg-indigo-400/10" />

            {/* Clouds — varied size, position and drift speed for depth. */}
            <Cloud className="left-[3%] top-[10%]" dur={54} delay={-4} scale={1.1} />
            <Cloud className="left-[37%] top-[5%]" dur={62} delay={-19} scale={0.8} opacity={0.82} />
            <Cloud className="right-[5%] top-[14%]" dur={50} delay={-9} scale={1.3} />
            <Cloud className="left-[14%] top-[46%]" dur={66} delay={-27} scale={0.95} opacity={0.85} />
            <Cloud className="right-[16%] top-[54%]" dur={58} delay={-13} scale={1.05} />
            <Cloud className="left-[58%] top-[74%]" dur={70} delay={-32} scale={0.75} opacity={0.72} />
        </div>
    );
}
