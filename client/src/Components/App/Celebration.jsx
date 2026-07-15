import { useEffect, useRef } from "react";

// Celebratory UI for a Top-3 finish on a competitive test. Self-contained: the
// confetti is a tiny canvas particle burst (no dependency) that respects
// prefers-reduced-motion and cleans itself up.

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const CONFETTI_COLORS = ["#4f46e5", "#7c3aed", "#EC7A54", "#3FB0D6", "#f59e0b", "#10b981"];

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Confetti() {
    const ref = useRef(null);
    useEffect(() => {
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return undefined;
        const canvas = ref.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return undefined;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        resize();

        const parts = Array.from({ length: 150 }, () => ({
            x: canvas.width / 2 + (Math.random() - 0.5) * 90,
            y: canvas.height * 0.4 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 9,
            vy: Math.random() * -9 - 3,
            g: 0.22 + Math.random() * 0.12,
            size: 5 + Math.random() * 6,
            color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            life: 0,
            max: 90 + Math.random() * 45,
        }));

        let raf;
        let frame = 0;
        const tick = () => {
            frame += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            for (const p of parts) {
                if (p.life > p.max) continue;
                alive += 1;
                p.life += 1;
                p.vy += p.g;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
            if (alive > 0 && frame < 320) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}

// Shown when the logged-in student finished in the Top 3.
export function Celebration({ rank, timesAtRank = 0 }) {
    const medal = MEDAL[rank] || "🎉";
    const nth =
        timesAtRank > 1 ? ` This is your ${ordinal(timesAtRank)} time reaching Rank #${rank}!` : "";
    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-6 text-center">
            <Confetti />
            <div className="relative">
                <div className="text-5xl" role="img" aria-label={`Rank ${rank} medal`}>
                    {medal}
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                    🎉 Congratulations! You secured Rank&nbsp;#{rank}
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-600">
                    An outstanding performance in this test.{nth} Keep up the excellent work!
                </p>
            </div>
        </div>
    );
}

// Shown when the student took the test but finished outside the Top 3.
export function Encourage({ rank, total }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="text-4xl" role="img" aria-label="Keep going">
                💪
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Great effort!</h2>
            <p className="mt-1 text-sm text-slate-500">
                You finished{rank ? ` #${rank}` : ""}
                {total ? ` of ${total}` : ""}. Keep practicing — your next Top&nbsp;3 finish could
                be just around the corner.
            </p>
        </div>
    );
}
