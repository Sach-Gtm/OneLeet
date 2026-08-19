// ---------------------------------------------------------------------------
// Rendering engine for OneLeet's static SEO pages.
//
// Every page is a self-contained, zero-JavaScript HTML document: inline critical
// CSS, a system font stack (no render-blocking web-font fetch), responsive
// layout, semantic H1–H6, breadcrumbs, rich internal linking and JSON-LD. That
// combination is what makes these pages crawlable by Google/Bing AND by AI
// answer engines (which often don't run JS), while scoring well on Core Web
// Vitals out of the box.
// ---------------------------------------------------------------------------

import { BASE, BRAND } from "./data.mjs";

export const esc = (s = "") =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

export const url = (path) => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
export const OG_IMAGE = `${BASE}/og-image.png`;

// Static OneLeet mark (three growth bars + briefcase) — mirrors the app logo.
const LOGO = `<svg width="30" height="30" viewBox="0 0 104 112" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<rect x="16" y="66" width="18" height="38" rx="9" fill="#4FB2D6"/>
<rect x="44" y="46" width="18" height="58" rx="9" fill="#918B83"/>
<rect x="72" y="24" width="18" height="80" rx="9" fill="#E9744E"/>
<rect x="67" y="2" width="28" height="9" rx="4" fill="none" stroke="#1F2A3D" stroke-width="3.4"/>
<rect x="65" y="8" width="32" height="19" rx="4.5" fill="#1F2A3D"/>
<rect x="65" y="14" width="32" height="5" fill="#F5A623"/></svg>`;

const CSS = `
:root{--bg:#FAF9F6;--ink:#0f172a;--muted:#475569;--soft:#64748b;--line:#e2e8f0;--indigo:#4f46e5;--indigo-d:#4338ca;--blue:#3FB0D6;--orange:#EC7A54;--card:#ffffff}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;line-height:1.65;font-size:17px}
a{color:var(--indigo);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto;display:block}
.wrap{max-width:960px;margin:0 auto;padding:0 20px;position:relative;z-index:1}
header.site{position:sticky;top:0;z-index:20;background:rgba(250,249,246,.85);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
header.site .wrap{display:flex;align-items:center;gap:16px;height:60px}
.brand{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:19px;letter-spacing:-.02em}
.brand .o{color:var(--orange)}.brand .l{color:var(--blue)}
header.site nav{margin-left:auto;display:flex;gap:18px;flex-wrap:wrap}
header.site nav a{color:var(--muted);font-weight:600;font-size:15px}
.cta-top{background:var(--indigo);color:#fff!important;padding:8px 16px;border-radius:9px;font-weight:700}
.cta-top:hover{background:var(--indigo-d);text-decoration:none}
main{padding:14px 0 8px;position:relative;overflow:hidden}
main::before{content:"";position:absolute;top:-70px;right:-90px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle at 32% 30%,rgba(124,58,237,.16),rgba(219,39,119,.10) 45%,transparent 72%);z-index:0;pointer-events:none;animation:floatA 22s ease-in-out infinite}
main::after{content:"";position:absolute;top:340px;left:-120px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(63,176,214,.14),transparent 70%);z-index:0;pointer-events:none;animation:floatB 26s ease-in-out infinite}
.crumbs{font-size:13px;color:var(--soft);padding:16px 0 4px}
.crumbs a{color:var(--soft)}.crumbs span[aria-current]{color:var(--muted);font-weight:600}
.eyebrow{display:inline-block;background:#eef2ff;color:var(--indigo);font-weight:700;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;padding:5px 11px;border-radius:999px;margin:10px 0 6px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.12;letter-spacing:-.02em;margin:.2em 0 .35em}
.lead{font-size:19px;color:var(--muted);margin:0 0 8px;max-width:44em}
h2{font-size:clamp(22px,3.4vw,27px);letter-spacing:-.01em;margin:1.8em 0 .5em;padding-top:.2em}
h3{font-size:19px;margin:1.4em 0 .4em}
p,li{color:#1f2937}
section p:first-child{margin-top:.3em}
.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin:16px 0}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px}
a.card:hover{border-color:#c7d2fe;box-shadow:0 6px 20px -12px rgba(79,70,229,.4);text-decoration:none}
.card h3{margin:.1em 0 .25em;font-size:16.5px;color:var(--ink)}
.card p{margin:0;font-size:14px;color:var(--soft)}
.pill-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.pill{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:14px;color:var(--muted);font-weight:600}
a.pill:hover{border-color:#c7d2fe;color:var(--indigo);text-decoration:none}
.note{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:13px 16px;font-size:15px;color:#92400e;margin:16px 0}
.callout{position:relative;overflow:hidden;isolation:isolate;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 52%,#db2777 100%);color:#fff;border-radius:20px;padding:34px 26px;margin:30px 0;text-align:center;box-shadow:0 22px 48px -24px rgba(79,70,229,.7)}
.callout h2,.callout p,.callout .btn{position:relative;z-index:2}
.callout::before,.callout::after{content:"";position:absolute;border-radius:50%;filter:blur(36px);opacity:.55;z-index:0;pointer-events:none}
.callout::before{width:210px;height:210px;background:#a855f7;top:-84px;left:-52px;animation:floatA 13s ease-in-out infinite}
.callout::after{width:184px;height:184px;background:#f472b6;bottom:-84px;right:-42px;animation:floatB 16s ease-in-out infinite}
.callout .rays{position:absolute;top:50%;left:50%;width:560px;height:560px;z-index:0;opacity:.15;pointer-events:none;transform:translate(-50%,-50%);animation:spin 48s linear infinite}
.callout .dots{position:absolute;inset:0;width:100%;height:100%;z-index:0;opacity:.16;pointer-events:none}
.callout h2{color:#fff;margin:.1em 0 .3em}
.callout p{color:#eef2ff;margin:.2em auto 18px;max-width:40em}
.btn{position:relative;display:inline-block;background:#fff;color:var(--indigo)!important;font-weight:800;padding:13px 28px;border-radius:12px;box-shadow:0 10px 24px -10px rgba(0,0,0,.35);transition:transform .18s ease,box-shadow .18s ease}
.btn:hover{text-decoration:none;transform:translateY(-2px);box-shadow:0 16px 30px -12px rgba(0,0,0,.42)}
.faq{margin:10px 0}
.faq details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:2px 18px;margin:10px 0}
.faq summary{cursor:pointer;font-weight:700;padding:14px 0;list-style:none;font-size:17px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";float:right;color:var(--indigo);font-weight:700}
.faq details[open] summary::after{content:"-"}
.faq details>p{margin:0 0 14px;color:var(--muted);font-size:16px}
.feat{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));margin:14px 0}
.feat div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.feat strong{display:block;color:var(--ink);font-size:15.5px;margin-bottom:2px}
.feat span{font-size:14px;color:var(--soft)}
.thumb{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;border:1px solid var(--line);margin:6px 0 4px}
hr{border:0;border-top:1px solid var(--line);margin:34px 0}
footer.site{border-top:1px solid var(--line);background:#fff;margin-top:44px}
footer.site .wrap{padding:34px 20px}
footer.site .cols{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
footer.site h4{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--soft);margin:0 0 10px}
footer.site a{color:var(--muted);font-size:14.5px;display:block;padding:3px 0}
footer.site .fine{color:var(--soft);font-size:13px;margin-top:22px;border-top:1px solid var(--line);padding-top:18px;line-height:1.6}
@media(max-width:640px){body{font-size:16px}header.site nav a:not(.cta-top){display:none}}
@keyframes floatA{0%,100%{transform:translate(0,0)}50%{transform:translate(34px,26px)}}
@keyframes floatB{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,-22px)}}
@keyframes spin{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes riseY{from{transform:translateY(16px)}to{transform:none}}
/* Gentle load-in for the hero. Never hides real content: h1 slides only (no
   fade), and everything ends fully visible via fill:both. */
.eyebrow{animation:rise .5s .02s both}
main>.wrap>h1{animation:riseY .6s .05s both}
.lead{animation:rise .55s .14s both}
.callout{animation:rise .7s .05s both}
/* Respect reduced-motion: kill all motion; base styles are always visible. */
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

export function orgJsonld() {
    return {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": `${BASE}/#organization`,
        name: BRAND,
        alternateName: "OneLeet: LEET Preparation",
        url: `${BASE}/`,
        logo: `${BASE}/pwa-512x512.png`,
        image: OG_IMAGE,
        description:
            "OneLeet is an AI-powered preparation platform for the LEET / Lateral Entry Entrance Test, helping diploma holders get into the 2nd year of B.Tech with real past papers, exam-pattern mock tests, notes and AI practice.",
        email: "help@oneleet.in",
        parentOrganization: { "@type": "Organization", name: "StaplerLabs Private Limited" },
        areaServed: "IN",
        knowsAbout: [
            "LEET", "Lateral Entry Entrance Test", "Lateral entry into B.Tech",
            "Diploma to B.Tech", "Engineering entrance preparation",
        ],
        sameAs: [],
    };
}

export function websiteJsonld() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${BASE}/#website`,
        url: `${BASE}/`,
        name: BRAND,
        publisher: { "@id": `${BASE}/#organization` },
        potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${BASE}/leet/?q={search_term_string}` },
            "query-input": "required name=search_term_string",
        },
    };
}

export function breadcrumbsHtml(items) {
    const html =
        `<nav class="crumbs" aria-label="Breadcrumb">` +
        items
            .map((it, i) =>
                i === items.length - 1
                    ? `<span aria-current="page">${esc(it.name)}</span>`
                    : `<a href="${it.url}">${esc(it.name)}</a> <span aria-hidden="true">›</span> `
            )
            .join("") +
        `</nav>`;
    const jsonld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            item: it.url.startsWith("http") ? it.url : url(it.url),
        })),
    };
    return { html, jsonld };
}

// Renders a FAQ block AND its FAQPage schema from the same source of truth.
export function faq(items) {
    const html =
        `<section class="faq"><h2>Frequently asked questions</h2>` +
        items
            .map(
                (f) =>
                    `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`
            )
            .join("") +
        `</section>`;
    const jsonld = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) },
        })),
    };
    return { html, jsonld };
}

const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");

// Course schema — OneLeet's LEET preparation as a Course provided by the org.
// Rich-result eligible (name + description + provider + hasCourseInstance +
// a free Offer). Honest: the core prep really is free to start.
export function courseJsonld({ name, description, path = "/leet/" } = {}) {
    return {
        "@context": "https://schema.org",
        "@type": "Course",
        name: name || "LEET Preparation Course",
        description:
            description ||
            "Complete LEET (Lateral Entry Entrance Test) preparation for diploma holders: real previous-year papers, exam-pattern mock tests, subject notes and AI practice, for direct admission into 2nd-year B.Tech.",
        url: url(path),
        provider: { "@type": "EducationalOrganization", "@id": `${BASE}/#organization`, name: BRAND },
        inLanguage: "en-IN",
        isAccessibleForFree: true,
        about: "Lateral Entry Entrance Test (LEET)",
        educationalLevel: "Undergraduate: B.Tech 2nd-year lateral entry",
        audience: { "@type": "EducationalAudience", educationalRole: "student" },
        hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: "PT40H",
        },
        offers: {
            "@type": "Offer",
            category: "Free",
            price: "0",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: `${BASE}/register`,
        },
    };
}

const NAV = `<nav>
<a href="${BASE}/leet/">LEET Guide</a>
<a href="${BASE}/leet/after-diploma/">After Diploma</a>
<a href="${BASE}/leet/previous-year-papers/">Past Papers</a>
<a href="${BASE}/leet/mock-tests/">Mock Tests</a>
<a class="cta-top" href="${BASE}/register">Start free</a>
</nav>`;

function footer() {
    return `<footer class="site"><div class="wrap">
<a class="brand" href="${BASE}/leet/">${LOGO}<span><span class="o">One</span><span class="l">Leet</span></span></a>
<p style="color:var(--soft);font-size:14.5px;max-width:40em;margin:12px 0 20px">Everything for your Lateral Entry Entrance Test in one place: real past papers, exam-pattern mock tests, smart notes and an AI coach that adapts to you.</p>
<div class="cols">
<div><h4>LEET Guide</h4>
<a href="${BASE}/leet/">What is LEET</a>
<a href="${BASE}/leet/eligibility/">Eligibility</a>
<a href="${BASE}/leet/syllabus/">Syllabus</a>
<a href="${BASE}/leet/exam-pattern/">Exam pattern</a>
<a href="${BASE}/leet/how-to-prepare/">How to prepare</a></div>
<div><h4>Practice</h4>
<a href="${BASE}/leet/previous-year-papers/">Previous papers</a>
<a href="${BASE}/leet/mock-tests/">Mock tests</a>
<a href="${BASE}/leet/subjects/">Subjects</a>
<a href="${BASE}/leet/colleges/">Colleges</a>
<a href="${BASE}/leet/after-diploma/">After diploma</a></div>
<div><h4>Popular states</h4>
<a href="${BASE}/leet/bihar/">Bihar LEET</a>
<a href="${BASE}/leet/uttar-pradesh/">Uttar Pradesh</a>
<a href="${BASE}/leet/punjab/">Punjab</a>
<a href="${BASE}/leet/haryana/">Haryana</a>
<a href="${BASE}/leet/delhi/">Delhi</a></div>
<div><h4>OneLeet</h4>
<a href="${BASE}/">Home</a>
<a href="${BASE}/register">Create free account</a>
<a href="${BASE}/login">Log in</a>
<a href="${BASE}/mentor">Team</a>
<a href="mailto:help@oneleet.in">help@oneleet.in</a></div>
</div>
<p class="fine">&copy; ${new Date().getFullYear()} OneLeet · A unit of StaplerLabs Private Limited. Study materials are provided for educational purposes. LEET / lateral-entry exam names, dates, eligibility and cut-offs vary by state and change every year. Always confirm the current details in the official notification of your state's admission authority before applying.</p>
</div></footer>`;
}

// The one function every page goes through.
export function layout({ path, title, description, ogType = "article", h1, eyebrow, crumbs, bodyHtml, jsonld = [] }) {
    const canonical = url(path);
    const bc = crumbs ? breadcrumbsHtml(crumbs) : null;
    const graph = [orgJsonld(), websiteJsonld(), ...(bc ? [bc.jsonld] : []), ...jsonld];
    const ld = graph
        .map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`)
        .join("\n");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#3FB0D6">
<link rel="icon" href="${BASE}/favicon.ico?v=2" sizes="any">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg?v=2">
<link rel="icon" type="image/png" sizes="96x96" href="${BASE}/favicon-96x96.png?v=2">
<link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png?v=2">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<style>${CSS}</style>
${ld}
</head>
<body>
<header class="site"><div class="wrap">
<a class="brand" href="${BASE}/leet/">${LOGO}<span><span class="o">One</span><span class="l">Leet</span></span></a>
${NAV}
</div></header>
<main><div class="wrap">
${bc ? bc.html : ""}
${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ""}
<h1>${h1}</h1>
${bodyHtml}
</div></main>
${footer()}
</body>
</html>`;
}

// Decorative, zero-JS depth layers for the CTA banner: a slowly-rotating ray
// burst + a fine dot texture over the gradient, so it reads as a lit 3D panel
// instead of a flat colour block. Both are aria-hidden and pointer-events:none.
const CTA_RAYS =
    `<svg class="rays" viewBox="0 0 400 400" aria-hidden="true" focusable="false">` +
    `<defs><radialGradient id="cr" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M200 200 L191 0 L209 0 Z" fill="url(#cr)" transform="rotate(${i * 30} 200 200)"/>`).join("") +
    `</svg>`;
const CTA_DOTS =
    `<svg class="dots" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">` +
    `<defs><pattern id="cd" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff"/></pattern></defs>` +
    `<rect width="100%" height="100%" fill="url(#cd)"/></svg>`;

// Standard OneLeet CTA block reused across pages.
export function ctaBlock(heading = "Start preparing for LEET, free", sub = "Real past papers, exam-pattern mock tests and unlimited AI practice. Built for diploma students. No coaching fees.") {
    return `<div class="callout">${CTA_RAYS}${CTA_DOTS}<h2>${esc(heading)}</h2><p>${esc(sub)}</p><a class="btn" href="${BASE}/register">Create your free account →</a></div>`;
}

// "Why OneLeet" feature strip (truthful — these are real product features).
export function featureStrip() {
    return `<div class="feat">
<div><strong>Real past papers</strong><span>Practise what LEET actually asks, not generic questions.</span></div>
<div><strong>Exam-pattern mocks</strong><span>Timed tests, instant scoring and every mistake explained.</span></div>
<div><strong>AI practice</strong><span>Unlimited questions on any topic and difficulty in seconds.</span></div>
<div><strong>Smart notes</strong><span>High-yield notes and flashcards for last-mile revision.</span></div>
<div><strong>Leaderboard</strong><span>Measure yourself against real aspirants every day.</span></div>
<div><strong>Mentors</strong><span>Guidance from students who actually cracked LEET.</span></div>
</div>`;
}

export { LOGO };
