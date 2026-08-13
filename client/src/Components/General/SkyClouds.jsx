// A soft, realistic sky backdrop: a light-blue gradient (dusk navy in dark
// mode) with a few fluffy white clouds drifting gently across it — the "seems
// real" sky behind the batches. Purely decorative (aria-hidden); the host needs
// `relative` and usually `overflow-hidden`. Motion is transform-only via
// .ol-cloud and stops under prefers-reduced-motion, where the clouds simply
// rest in place.

// One cloud = solid white lobes over a flat-bottomed base, fused by a tiny blur
// on the whole cluster (not each puff) so it reads as one defined, opaque cloud
// rather than a soft glow. A soft drop-shadow underneath gives it depth. In dark
// mode the lobes go muted slate so they read as dusk clouds, not glaring blobs.
const LOBE = "absolute rounded-full bg-white dark:bg-slate-500";

function Cloud({ className = "", dur = 48, delay = 0, scale = 1, opacity = 1 }) {
    return (
        <div
            className={`ol-cloud absolute ${className}`}
            style={{ "--ol-cloud-dur": `${dur}s`, animationDelay: `${delay}s` }}
        >
            <div
                className="relative h-20 w-60"
                style={{
                    transform: `scale(${scale})`,
                    opacity,
                    // Small blur fuses the lobe seams into a solid mass; the
                    // drop-shadow lifts the cloud off the sky for definition.
                    filter: "blur(1.5px) drop-shadow(0 8px 10px rgba(30,58,90,0.18))",
                }}
            >
                {/* Flat-bottomed base (stadium shape). */}
                <span className={`${LOBE} bottom-0 left-1/2 h-12 w-56 -translate-x-1/2`} />
                {/* Lumpy top — biggest lobe in the middle. */}
                <span className={`${LOBE} bottom-3 left-5 h-16 w-16`} />
                <span className={`${LOBE} bottom-5 left-1/2 h-24 w-24 -translate-x-1/2`} />
                <span className={`${LOBE} bottom-4 right-6 h-16 w-16`} />
                <span className={`${LOBE} bottom-2 right-16 h-12 w-12`} />
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
            <Cloud className="left-[3%] top-[9%]" dur={54} delay={-4} scale={1.05} />
            <Cloud className="left-[36%] top-[4%]" dur={62} delay={-19} scale={0.72} opacity={0.95} />
            <Cloud className="right-[4%] top-[13%]" dur={50} delay={-9} scale={1.2} />
            <Cloud className="left-[13%] top-[47%]" dur={66} delay={-27} scale={0.9} opacity={0.92} />
            <Cloud className="right-[15%] top-[55%]" dur={58} delay={-13} scale={1} />
            <Cloud className="left-[58%] top-[75%]" dur={70} delay={-32} scale={0.7} opacity={0.9} />
        </div>
    );
}
