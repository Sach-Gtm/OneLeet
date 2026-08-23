// ---------------------------------------------------------------------------
// OneLeet per-route social/SEO meta pre-render (postbuild).
//
//   node scripts/prerender-meta.mjs   (runs automatically after `vite build`)
//
// The app's marketing routes (/pricing, /success, /success/:slug, …) are React
// SPA routes. Vercel's catch-all rewrite serves index.html for them, so a
// non-JS scraper (WhatsApp, Facebook, LinkedIn, X, Slack, Telegram) only ever
// saw the HOMEPAGE's title + OG card — every shared link looked identical.
//
// This clones the *built* dist/index.html (keeping its hashed script/CSS tags,
// so React still boots for real users) into per-route shells with the correct
// <title>, description, canonical and Open Graph / Twitter tags. Because a real
// file now exists at each path, Vercel serves it directly (filesystem beats the
// rewrite), so scrapers get a proper card while users still get the full SPA.
//
// The static copy mirrors each page's own useSeo() so there is no title flip
// when the SPA mounts. Success-story pages are pulled live from the public API;
// if that fetch fails the build still succeeds — those links just fall back to
// the default card (no regression).
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dir, "..", "dist");
const BASE = "https://www.oneleet.in";
const API = (process.env.VITE_API_URL || "https://oneleet-api.onrender.com/api").replace(/\/+$/, "");

const esc = (s) =>
    String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s, n) => {
    const t = String(s || "").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

// Static marketing routes — titles/descriptions copied verbatim from each
// page's useSeo() call so the static card and the SPA-set head always agree.
const STATIC = [
    { path: "/pricing", title: "LEET Courses & Mock Test Series: Pricing | OneLeet Premium", desc: "OneLeet membership: exam-wise LEET batches, ranked mock tests, past papers, notes, AI practice and counselling support. See plans, discounts and the Success Promise." },
    { path: "/colleges", title: "Engineering Colleges via Lateral Entry (LEET) | OneLeet", desc: "The B.Tech colleges you can reach through lateral entry as a diploma holder: DTU, NSUT, VJTI, IPU and more. See where LEET can take you." },
    { path: "/success", title: "LEET Success Stories: diploma to B.Tech, real students | OneLeet", desc: "Real OneLeet success stories, diploma students who cracked the Lateral Entry Entrance Test and got into 2nd-year B.Tech. See how they did it." },
    { path: "/exams", title: "LEET Exams by State: Pattern, Eligibility & Syllabus | OneLeet", desc: "Explore every LEET (Lateral Entry Entrance Test): IPU, DTU/NSUT, UP (AKTU), Bihar, Haryana and more. Compare exam pattern, eligibility, syllabus, seats and cut-offs, free." },
    { path: "/prep-guide", title: "How to Prepare for LEET: Free Study Plan & Roadmap | OneLeet", desc: "A stage-by-stage LEET preparation roadmap for diploma students, from your first month to exam day. Free overview; unlock the full day-by-day plan." },
    { path: "/mentor", title: "Meet the Team | OneLeet", desc: "The people working to make LEET preparation simpler, smarter, and more accessible, the founders and mentors behind OneLeet." },
];

// Swap the homepage's head tags for this route's. Regexes are dotall + lazy so
// they match both the single-line and multi-line tag styles in index.html and
// stop at each tag's own "/>" (tag contents never contain "/>").
function rewrite(html, { path, title, desc }) {
    const u = esc(`${BASE}${path}`);
    const t = esc(title);
    const d = esc(clip(desc, 200));
    const swaps = [
        [/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`],
        [/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${d}" />`],
        [/<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${u}" />`],
        [/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${t}" />`],
        [/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${d}" />`],
        [/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${u}" />`],
        [/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${t}" />`],
        [/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${d}" />`],
    ];
    let out = html;
    for (const [re, rep] of swaps) out = out.replace(re, rep);
    return out;
}

async function emit(shell, route) {
    const dir = resolve(DIST, "." + route.path);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, "index.html"), rewrite(shell, route));
}

async function fetchCases() {
    try {
        const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined;
        const res = await fetch(`${API}/reviews/cases`, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return Array.isArray(json.cases) ? json.cases : [];
    } catch (e) {
        console.warn(`[prerender] success stories skipped (${e.message}), they'll use the default card.`);
        return [];
    }
}

(async () => {
    try {
        const shellPath = resolve(DIST, "index.html");
        if (!existsSync(shellPath)) {
            console.warn("[prerender] no dist/index.html found, skipped.");
            return;
        }
        const shell = await readFile(shellPath, "utf8");

        for (const r of STATIC) await emit(shell, r);

        const cases = await fetchCases();
        for (const c of cases) {
            if (!c.slug) continue;
            const title = `${c.caseTitle || `How ${c.author || "a student"} cracked LEET`} | OneLeet Success Story`;
            const desc = c.text
                ? c.text
                : `How ${c.author || "a OneLeet student"} cracked ${c.exam || "LEET"}${c.rank ? `, ${c.rank}` : ""}${c.college ? `, now studying at ${c.college}` : ""}. A real OneLeet success story.`;
            await emit(shell, { path: `/success/${c.slug}`, title, desc });
        }
        console.log(`[prerender] wrote ${STATIC.length} static + ${cases.length} success-story meta shells.`);
    } catch (e) {
        // Best-effort enhancement: never fail the deploy. Un-rendered routes just
        // keep the default homepage card (exactly today's behaviour).
        console.warn("[prerender] skipped:", e.message);
    }
})();
