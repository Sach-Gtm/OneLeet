import { useEffect, useRef } from "react";

// A custom, self-drawn "growth" chart for the auth brand panel — an ascending
// area chart that draws itself in on mount (echoing the OneLeet rising-bars
// logo and a StaplerLabs-style analytics card), then holds. Pure Canvas 2D in
// brand colours; respects reduced motion and replays whenever it remounts.
const PTS = [
    [0.02, 0.86], [0.15, 0.72], [0.29, 0.78], [0.43, 0.56],
    [0.57, 0.62], [0.71, 0.40], [0.85, 0.30], [0.99, 0.12],
];

export default function GrowthCanvas({ className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let raf;
        let w = 1;
        let h = 1;

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

        const xy = (i) => [PTS[i][0] * w, PTS[i][1] * h];
        const yAt = (x) => {
            const fx = x / w;
            for (let i = 0; i < PTS.length - 1; i++) {
                if (fx >= PTS[i][0] && fx <= PTS[i + 1][0]) {
                    const t = (fx - PTS[i][0]) / (PTS[i + 1][0] - PTS[i][0] || 1);
                    return (PTS[i][1] + t * (PTS[i + 1][1] - PTS[i][1])) * h;
                }
            }
            return PTS[PTS.length - 1][1] * h;
        };

        const buildLine = () => {
            const p = new Path2D();
            const [x0, y0] = xy(0);
            p.moveTo(x0, y0);
            for (let i = 1; i < PTS.length - 1; i++) {
                const [x1, y1] = xy(i);
                const [x2, y2] = xy(i + 1);
                p.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
            }
            const [xl, yl] = xy(PTS.length - 1);
            p.quadraticCurveTo(xl, yl, xl, yl);
            return p;
        };

        const draw = (p) => {
            ctx.clearRect(0, 0, w, h);

            // faint grid
            ctx.strokeStyle = "rgba(79,70,229,0.08)";
            ctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++) {
                const y = (h / 5) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            const revealX = Math.max(1, p * w);
            const line = buildLine();

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, revealX, h);
            ctx.clip();

            // area fill
            const area = new Path2D(line);
            area.lineTo(xy(PTS.length - 1)[0], h);
            area.lineTo(xy(0)[0], h);
            area.closePath();
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, "rgba(99,102,241,0.28)");
            g.addColorStop(1, "rgba(139,92,246,0.02)");
            ctx.fillStyle = g;
            ctx.fill(area);

            // line stroke
            const lg = ctx.createLinearGradient(0, 0, w, 0);
            lg.addColorStop(0, "#6366f1");
            lg.addColorStop(1, "#8b5cf6");
            ctx.strokeStyle = lg;
            ctx.lineWidth = 3;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke(line);
            ctx.restore();

            // leading dot
            const dy = yAt(revealX);
            ctx.beginPath();
            ctx.arc(revealX, dy, 9, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(99,102,241,0.18)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(revealX, dy, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#6366f1";
            ctx.stroke();
        };

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            draw(1);
        } else {
            const DURATION = 2200;
            const start = performance.now();
            const loop = (now) => {
                const t = Math.min((now - start) / DURATION, 1);
                draw(1 - Math.pow(1 - t, 3)); // ease-out cubic
                if (t < 1) raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={ref} className={className} aria-hidden="true" />;
}
