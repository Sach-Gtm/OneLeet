import { useEffect, useRef } from "react";

// A gently drifting constellation of connected nodes — a wordless "network of
// sharp, connected minds" feeling. Brand indigo/violet, pure Canvas 2D, and it
// freezes for reduced-motion users.
export default function NetworkCanvas({ className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let raf;
        let w = 1;
        let h = 1;
        let nodes = [];
        const N = 24;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth || 1;
            h = canvas.clientHeight || 1;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);

        const rand = () => Math.random();
        nodes = Array.from({ length: N }, () => ({
            x: rand() * w,
            y: rand() * h,
            vx: (rand() - 0.5) * 0.22,
            vy: (rand() - 0.5) * 0.22,
            r: 1.4 + rand() * 2,
        }));

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const step = () => {
            ctx.clearRect(0, 0, w, h);

            if (!reduce) {
                for (const n of nodes) {
                    n.x += n.vx;
                    n.y += n.vy;
                    if (n.x < 0 || n.x > w) n.vx *= -1;
                    if (n.y < 0 || n.y > h) n.vy *= -1;
                }
            }

            const maxD = Math.min(w, h) * 0.32;
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < maxD) {
                        ctx.strokeStyle = `rgba(99,102,241,${0.18 * (1 - d / maxD)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            for (const n of nodes) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(124,58,237,0.75)";
                ctx.fill();
            }

            if (!reduce) raf = requestAnimationFrame(step);
        };

        if (reduce) step();
        else raf = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={ref} className={className} aria-hidden="true" />;
}
