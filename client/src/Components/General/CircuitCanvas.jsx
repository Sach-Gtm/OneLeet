import { useEffect, useRef } from "react";

// A wordless "engineering circuit" — PCB-style traces with glowing pulses that
// travel left→right and light the pads they pass. The hands-on, practical edge
// of an engineer: things that actually get built, and work. Pure Canvas 2D in
// brand indigo/violet; freezes to a static board for reduced-motion users.
export default function CircuitCanvas({ className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const rand = () => Math.random();
        let raf;
        let w = 1;
        let h = 1;
        let traces = [];
        let last = performance.now();

        // Lay out left→right traces with the odd right-angle jog, a pad at every
        // vertex, and a pulse riding each one.
        const build = () => {
            const rows = Math.max(3, Math.round(h / 46));
            traces = [];
            for (let r = 0; r < rows; r++) {
                const laneH = h / rows;
                const y = (r + 0.5) * laneH;
                const pts = [{ x: -12, y }];
                const segs = 3 + Math.floor(rand() * 3);
                let cy = y;
                for (let s = 0; s < segs; s++) {
                    const nx = ((s + 1) / segs) * w;
                    pts.push({ x: nx, y: cy });
                    // occasional vertical jog into a neighbouring lane
                    if (rand() < 0.5 && s < segs - 1) {
                        const dir = rand() < 0.5 ? -1 : 1;
                        cy = Math.max(6, Math.min(h - 6, cy + dir * laneH * (0.4 + rand() * 0.5)));
                        pts.push({ x: nx, y: cy });
                    }
                }
                pts.push({ x: w + 12, y: cy });

                const segLens = [];
                let total = 0;
                for (let i = 0; i < pts.length - 1; i++) {
                    const L = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
                    segLens.push(L);
                    total += L;
                }
                traces.push({
                    pts,
                    segLens,
                    total,
                    speed: 42 + rand() * 46, // px/sec
                    offset: rand() * total, // starting pulse position
                });
            }
        };

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth || 1;
            h = canvas.clientHeight || 1;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
        };
        resize();
        window.addEventListener("resize", resize);

        // Point at arc-length d along a trace (wraps around).
        const pointAt = (tr, d) => {
            let dd = ((d % tr.total) + tr.total) % tr.total;
            for (let i = 0; i < tr.segLens.length; i++) {
                if (dd <= tr.segLens[i]) {
                    const t = dd / (tr.segLens[i] || 1);
                    const a = tr.pts[i];
                    const b = tr.pts[i + 1];
                    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
                }
                dd -= tr.segLens[i];
            }
            const p = tr.pts[tr.pts.length - 1];
            return { x: p.x, y: p.y };
        };

        const drawBoard = () => {
            for (const tr of traces) {
                ctx.strokeStyle = "rgba(99,102,241,0.15)";
                ctx.lineWidth = 1.5;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
                for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y);
                ctx.stroke();
                for (let i = 1; i < tr.pts.length - 1; i++) {
                    ctx.beginPath();
                    ctx.arc(tr.pts[i].x, tr.pts[i].y, 2.3, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(124,58,237,0.30)";
                    ctx.fill();
                }
            }
        };

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const frame = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            ctx.clearRect(0, 0, w, h);
            drawBoard();

            const TAIL = 50;
            for (const tr of traces) {
                tr.offset += tr.speed * dt;
                // trailing comet
                for (let k = 6; k >= 1; k--) {
                    const p = pointAt(tr, tr.offset - (k / 6) * TAIL);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(99,102,241,${0.42 * (1 - k / 7)})`;
                    ctx.fill();
                }
                // bright head + glow
                const head = pointAt(tr, tr.offset);
                ctx.shadowColor = "rgba(124,58,237,0.85)";
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(head.x, head.y, 2.8, 0, Math.PI * 2);
                ctx.fillStyle = "#a78bfa";
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            raf = requestAnimationFrame(frame);
        };

        if (reduce) {
            ctx.clearRect(0, 0, w, h);
            drawBoard();
        } else {
            last = performance.now();
            raf = requestAnimationFrame(frame);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={ref} className={className} aria-hidden="true" />;
}
