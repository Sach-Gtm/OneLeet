// Animated topographic-contour background: two drifting sets of concentric rings
// (transform-only, GPU-composited — see .ol-topo in index.css). Colour + opacity
// are props so it sits cleanly on light or dark surfaces. Decorative and
// pointer-transparent; the host must be `relative overflow-hidden`.
export default function TopoLines({ className = "", color = "rgb(99 102 241)", opacity = 0.12 }) {
    return (
        <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
            <div className="ol-topo absolute -inset-[20%]" style={{ color, opacity }} />
        </div>
    );
}
