import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

// A GPU-rendered "aurora" wash for the light theme. A soft pastel colour field
// is generated live in a fragment shader (domain-warped simplex noise), animated
// over time and nudged by the pointer — an airy, weightless backdrop that keeps
// dark text fully readable. Runs entirely on the GPU, degrades gracefully when
// WebGL is unavailable, and freezes for users who prefer reduced motion.
const vertex = /* glsl */ `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragment = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;

    // Ashima 2D simplex noise.
    vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m; m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
            v += a * snoise(p);
            p *= 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = uv;
        p.x *= aspect;

        float t = uTime * 0.04;
        vec2 m = (uMouse - 0.5) * 0.4;

        // Domain warp for that organic, flowing look.
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p + 1.6 * q + vec2(1.7, 9.2) + m),
                      fbm(p + 1.6 * q + vec2(8.3, 2.8) - t));
        float f = fbm(p + 1.6 * r);

        // Soft, airy pastels on near-white.
        vec3 base   = vec3(0.965, 0.967, 1.000);
        vec3 indigo = vec3(0.647, 0.678, 0.988);
        vec3 violet = vec3(0.808, 0.706, 0.976);
        vec3 peach  = vec3(0.996, 0.847, 0.706);

        vec3 col = base;
        col = mix(col, indigo, clamp(smoothstep(-0.1, 0.95, f) * 0.55, 0.0, 1.0));
        col = mix(col, violet, clamp(smoothstep(0.05, 1.25, length(q)) * 0.5, 0.0, 1.0));
        col = mix(col, peach,  clamp(smoothstep(0.7, 1.35, f + 0.35 * r.x) * 0.45, 0.0, 1.0));

        // Lift toward white so it stays a gentle, premium haze behind text.
        col = mix(vec3(1.0), col, 0.62);

        gl_FragColor = vec4(col, 1.0);
    }
`;

export default function ShaderHero({ className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        let renderer, program, mesh, gl, raf;
        try {
            renderer = new Renderer({
                dpr: Math.min(window.devicePixelRatio || 1, 1.25),
                alpha: false,
                antialias: false,
            });
            gl = renderer.gl;

            const geometry = new Triangle(gl);
            program = new Program(gl, {
                vertex,
                fragment,
                uniforms: {
                    uTime: { value: 0 },
                    uResolution: { value: [1, 1] },
                    uMouse: { value: [0.5, 0.5] },
                },
            });
            mesh = new Mesh(gl, { geometry, program });
        } catch {
            // WebGL unavailable — leave the light layout background showing.
            return;
        }

        gl.canvas.style.width = "100%";
        gl.canvas.style.height = "100%";
        gl.canvas.style.display = "block";
        container.appendChild(gl.canvas);

        const resize = () => {
            const w = container.clientWidth || 1;
            const h = container.clientHeight || 1;
            renderer.setSize(w, h);
            program.uniforms.uResolution.value = [
                gl.drawingBufferWidth,
                gl.drawingBufferHeight,
            ];
        };
        resize();
        window.addEventListener("resize", resize);

        const onPointer = (e) => {
            const rect = container.getBoundingClientRect();
            program.uniforms.uMouse.value = [
                (e.clientX - rect.left) / Math.max(rect.width, 1),
                1 - (e.clientY - rect.top) / Math.max(rect.height, 1),
            ];
        };
        window.addEventListener("pointermove", onPointer);

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            program.uniforms.uTime.value = 12.0;
            renderer.render({ scene: mesh });
        } else {
            // Play an intro that eases to a gentle stop, then hold the frame —
            // "runs on open, then settles". Re-runs whenever this remounts
            // (e.g. navigating login → register opens a fresh page).
            const DURATION = 9000;
            const start = performance.now();
            let last = start;
            let elapsed = 0;
            const loop = (now) => {
                const prog = Math.min((now - start) / DURATION, 1);
                const speed = 0.5 + 0.5 * Math.cos(prog * Math.PI); // 1 → 0 ease
                elapsed += (now - last) * speed;
                last = now;
                program.uniforms.uTime.value = elapsed / 1000;
                renderer.render({ scene: mesh });
                if (prog < 1) raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        }

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            window.removeEventListener("pointermove", onPointer);
            const ext = gl.getExtension("WEBGL_lose_context");
            if (ext) ext.loseContext();
            if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
        };
    }, []);

    return <div ref={ref} className={className} aria-hidden="true" />;
}
