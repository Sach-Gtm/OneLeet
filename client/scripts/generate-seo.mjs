// ---------------------------------------------------------------------------
// OneLeet programmatic SEO generator.
//
//   node scripts/generate-seo.mjs
//
// Renders the LEET data model (scripts/seo/data.mjs) into a tree of pre-rendered
// static HTML landing pages under public/leet and public/guides, plus
// sitemap.xml, robots.txt and llms.txt at the site root. Runs automatically
// before every Vite build via the "prebuild" npm hook, so the pages and sitemap
// stay in sync with the data on every deploy.
//
// Design goals: each page is genuinely differentiated (it leads with its own
// entity — a state, a subject, an opportunity — not a boilerplate paragraph),
// carries correct metadata + JSON-LD, links richly into the rest of the site,
// and stays evergreen/honest about anything that changes year to year.
// ---------------------------------------------------------------------------

import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, BRAND, STATES, SUBJECTS, COLLEGES, GUIDES, APP_REGISTER } from "./seo/data.mjs";
import { layout, faq, ctaBlock, featureStrip, esc, url } from "./seo/render.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dir, "..", "public");
const TODAY = new Date().toISOString().slice(0, 10);
const slugify = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const pages = []; // { path, priority, changefreq }
async function writePage(path, html, priority = 0.6, changefreq = "monthly") {
    const clean = path.endsWith("/") ? path : path + "/";
    const file = resolve(PUBLIC, "." + clean, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
    pages.push({ path: clean, priority, changefreq });
}

// ---- reusable link cards -------------------------------------------------
const stateCard = (s) =>
    `<a class="card" href="${BASE}/leet/${s.slug}/"><h3>LEET in ${esc(s.name)}</h3><p>Lateral entry into B.Tech in ${esc(s.name)} — eligibility, subjects &amp; preparation.</p></a>`;
const subjectCard = (s) =>
    `<a class="card" href="${BASE}/leet/subjects/${s.slug}/"><h3>${esc(s.name)}</h3><p>Syllabus, key topics and practice for the ${esc(s.name)} section.</p></a>`;
const guideCard = (g) =>
    `<a class="card" href="${BASE}/guides/${g.slug}/"><h3>${esc(g.title)}</h3><p>${esc(g.desc.slice(0, 96))}…</p></a>`;
const collegeCard = (c) =>
    `<a class="card" href="${BASE}/leet/colleges/${c.slug}/"><h3>${esc(c.name)}</h3><p>Lateral-entry admission &amp; preparation for ${esc(c.city)}.</p></a>`;
const cards = (items, fn) => `<div class="grid">${items.map(fn).join("")}</div>`;

const coreSubjects = SUBJECTS.filter((s) => s.core);
const featuredStates = STATES.filter((s) => s.featured);

// A short, differently-phrased "what is LEET" line per context, always linking
// to the pillar for the full explanation (avoids duplicate-content blocks).
const leetLine = (ctx) =>
    `The <a href="${BASE}/leet/">Lateral Entry Entrance Test (LEET)</a> is how a diploma holder ${ctx} — joining a B.Tech / B.E. degree directly in the <strong>second year</strong> instead of starting over in the first.`;

// ===========================================================================
// PILLAR — /leet
// ===========================================================================
async function buildPillar() {
    const faqs = [
        { q: "What is LEET?", a: `LEET stands for the <strong>Lateral Entry Entrance Test</strong>. It lets a diploma holder join an engineering degree (B.Tech / B.E.) directly in the second year, skipping the first year. Selection is through a state-conducted entrance test or lateral-entry counselling rather than JEE.` },
        { q: "Who is eligible for LEET / lateral entry?", a: `Generally, candidates with a three-year engineering diploma (typically around 45–50% marks, often relaxed for reserved categories) are eligible; several states also admit B.Sc graduates with Mathematics. Exact eligibility varies by state and year, so confirm the official notification.` },
        { q: "Which subjects does LEET test?", a: `Most papers test <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a> heavily, along with <a href="${BASE}/leet/subjects/physics/">Physics</a>, <a href="${BASE}/leet/subjects/chemistry/">Chemistry</a> and core engineering subjects such as <a href="${BASE}/leet/subjects/engineering-mechanics/">Engineering Mechanics</a> and Basic Electrical Engineering. Some states add English and aptitude.` },
        { q: "Is a lateral-entry B.Tech degree valid?", a: `Yes. You graduate with the same B.Tech / B.E. degree as students who joined in the first year — the certificate does not say "lateral entry". <a href="${BASE}/guides/lateral-entry-vs-regular-btech/">Read the full comparison</a>.` },
        { q: "Can I prepare for LEET without coaching?", a: `Absolutely. OneLeet gives you real past papers, exam-pattern mock tests, notes and unlimited AI practice so you can prepare on your own schedule. <a href="${BASE}/guides/leet-preparation-without-coaching/">Here's how</a>.` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">Everything a diploma student needs to crack the Lateral Entry Entrance Test and get into the 2nd year of B.Tech — real past papers, exam-pattern mock tests, smart notes and an AI coach, all in one place.</p>
${ctaBlock()}
<section><h2>What is LEET (Lateral Entry Entrance Test)?</h2>
<p>${leetLine("upgrades a polytechnic diploma into a full engineering degree")} Instead of competing with Class 12 students through JEE, you compete with fellow diploma holders for dedicated lateral-entry seats — a far more level field.</p>
<p>Each state runs its own version of lateral entry (some call it LEET, others DSE, JELET, ECET, D2D or lateral-entry counselling), but the idea is identical: your diploma has already taught you the first-year engineering fundamentals, so you skip straight to the second year.</p></section>
<section><h2>Choose your state</h2>
<p>LEET is state-specific. Start with your state for the eligibility, subjects and preparation that matter to you.</p>
${cards(featuredStates, stateCard)}
<div class="pill-row">${STATES.filter((s) => !s.featured).map((s) => `<a class="pill" href="${BASE}/leet/${s.slug}/">${esc(s.name)}</a>`).join("")}</div></section>
<section><h2>Master every subject</h2>
<p>The paper rewards fundamentals. Work through each section with a focused syllabus, the highest-yield topics and unlimited practice.</p>
${cards(SUBJECTS, subjectCard)}</section>
<section><h2>Practice like it's exam day</h2>
${featureStrip()}
<div class="pill-row">
<a class="pill" href="${BASE}/leet/previous-year-papers/">Previous year papers</a>
<a class="pill" href="${BASE}/leet/mock-tests/">Mock tests</a>
<a class="pill" href="${BASE}/leet/syllabus/">Full syllabus</a>
<a class="pill" href="${BASE}/leet/exam-pattern/">Exam pattern</a>
<a class="pill" href="${BASE}/leet/eligibility/">Eligibility</a>
<a class="pill" href="${BASE}/leet/how-to-prepare/">Study plan</a>
<a class="pill" href="${BASE}/leet/colleges/">Colleges</a>
</div></section>
<section><h2>The opportunity after your diploma</h2>
<p>Lateral entry is one of the smartest moves a diploma holder can make: a full engineering degree in two fewer years than starting fresh, better placements, eligibility for GATE and government engineering posts, and a path to M.Tech and beyond. <a href="${BASE}/leet/after-diploma/">See what opens up after your diploma →</a></p></section>
<section><h2>Guides &amp; answers</h2>
${cards(GUIDES.slice(0, 6), guideCard)}</section>
${f.html}`;
    await writePage("/leet", layout({
        path: "/leet/",
        title: "LEET Preparation — Lateral Entry Entrance Test Guide | OneLeet",
        description: "Crack LEET (Lateral Entry Entrance Test) and get into 2nd year B.Tech after your diploma. Free past papers, mock tests, syllabus, eligibility and AI practice for every state.",
        ogType: "website", eyebrow: "LEET / Lateral Entry",
        h1: "LEET Preparation: your diploma-to-B.Tech shortcut",
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 1.0, "weekly");
}

// ===========================================================================
// AFTER-DIPLOMA PILLAR — /leet/after-diploma
// ===========================================================================
async function buildAfterDiplomaPillar() {
    const faqs = [
        { q: "What can I do after a diploma in engineering?", a: `Three common paths: take a job with your diploma, or upgrade to a full B.Tech through <a href="${BASE}/leet/">lateral entry (LEET)</a> in two years, or start a degree from year one via JEE. Lateral entry is the fastest way to a degree because your diploma credits the first year.` },
        { q: "Is lateral entry better than a job after diploma?", a: `A B.Tech significantly widens your options — higher starting salaries, eligibility for GATE, PSU and government engineering roles, campus placements and post-graduation. Many students even work and prepare for lateral entry in parallel.` },
        { q: "Which branches can I take through lateral entry?", a: `Most core branches are open — Computer Science, Electronics, Electrical, Mechanical, Civil and more, subject to seat availability and, in some states, alignment with your diploma trade. <a href="${BASE}/guides/how-to-choose-your-btech-branch/">How to choose a branch →</a>` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">Your diploma isn't the finish line — it's a head start. Here's how lateral entry turns three years of polytechnic into a full engineering degree, and every opportunity that unlocks.</p>
${ctaBlock("Turn your diploma into a B.Tech", "Lateral entry lets you join 2nd year directly. Start preparing free with real papers and AI practice.")}
<section><h2>Why lateral entry is the smartest move after a diploma</h2>
<p>${leetLine("converts a completed diploma into a degree the efficient way")} You've already covered the first-year engineering basics, so you skip them — finishing a B.Tech in three more years instead of four.</p>
<ul>
<li><strong>Save a year (and the fees):</strong> you enter in the second year, not the first.</li>
<li><strong>Compete on a fair field:</strong> your rivals are fellow diploma holders, not Class 12 toppers.</li>
<li><strong>Unlock the degree-only doors:</strong> GATE, PSU recruitment, government AE/JE-to-degree posts, campus placements, and M.Tech / MBA later.</li>
<li><strong>Keep your practical edge:</strong> diploma students often out-perform in labs and projects because of hands-on training.</li>
</ul></section>
<section><h2>Opportunity by state</h2>
<p>The lateral-entry process is run by each state. Pick yours to see how it works and what to prepare.</p>
${cards(featuredStates, (s) => `<a class="card" href="${BASE}/leet/${s.slug}/after-diploma/"><h3>${esc(s.name)} after diploma</h3><p>Your lateral-entry opportunity in ${esc(s.name)} — scope, branches &amp; prep.</p></a>`)}
<div class="pill-row">${STATES.filter((s) => !s.featured).map((s) => `<a class="pill" href="${BASE}/leet/${s.slug}/after-diploma/">${esc(s.name)}</a>`).join("")}</div></section>
<section><h2>What you can become</h2>
<p>A lateral-entry B.Tech opens the same careers as any engineering degree: software and IT roles, core engineering in PSUs and private firms, government technical services through GATE, higher studies, and entrepreneurship. The degree you receive is identical to a first-year entrant's.</p>
<div class="pill-row">
<a class="pill" href="${BASE}/guides/is-lateral-entry-btech-worth-it/">Is it worth it?</a>
<a class="pill" href="${BASE}/guides/lateral-entry-vs-regular-btech/">Same as regular B.Tech?</a>
<a class="pill" href="${BASE}/guides/diploma-to-btech-complete-roadmap/">Full roadmap</a>
<a class="pill" href="${BASE}/guides/leet-vs-jee-which-path-after-diploma/">LEET vs JEE</a>
</div></section>
${f.html}`;
    await writePage("/leet/after-diploma", layout({
        path: "/leet/after-diploma/",
        title: "Opportunities After Diploma: Lateral Entry into B.Tech | OneLeet",
        description: "Finished your engineering diploma? See how lateral entry (LEET) gets you into 2nd year B.Tech, the branches and careers it unlocks, and how to prepare — state by state.",
        eyebrow: "After your diploma",
        h1: "After your diploma: the lateral-entry opportunity",
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "After Diploma", url: "/leet/after-diploma/" }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.9, "monthly");
}

// ===========================================================================
// STATE overview — /leet/:state
// ===========================================================================
async function buildState(s) {
    const authorityLine = s.authority
        ? `In ${s.name}, lateral-entry admission is typically handled through the <strong>${esc(s.authority)}</strong>${s.exam ? ` (commonly referred to as <strong>${esc(s.exam)}</strong>)` : ""}. Exact names, dates and rules change every year, so always confirm the current official notification before you apply.`
        : `In ${s.name}, lateral entry into B.Tech is handled through the state's technical-education admission process${s.exam && s.exam !== "lateral entry counselling" ? ` (often referred to as <strong>${esc(s.exam)}</strong>)` : " (an entrance test and/or merit-based counselling)"}. The exact exam name, dates and eligibility change year to year, so confirm the current official notification before applying.`;
    const faqs = [
        { q: `How does lateral entry work in ${s.name}?`, a: `A diploma holder applies for lateral-entry seats and, based on an entrance test and/or merit, is allotted a seat directly in the second year of B.Tech at a participating ${esc(s.name)} college. ${s.authority ? `The process is usually run by the ${esc(s.authority)}.` : "The process is run by the state's technical-education authority."} Confirm current specifics in the official notification.` },
        { q: `Who is eligible for LEET in ${s.name}?`, a: `Typically a three-year engineering diploma with the minimum marks set by the state (often around 45–50%, relaxed for reserved categories); some states also allow B.Sc holders with Mathematics. See our <a href="${BASE}/leet/eligibility/">eligibility guide</a> and verify the ${esc(s.name)} notification.` },
        { q: `What should I study for lateral entry in ${s.name}?`, a: `Focus on <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a> first, then <a href="${BASE}/leet/subjects/physics/">Physics</a>, <a href="${BASE}/leet/subjects/chemistry/">Chemistry</a> and core engineering. Practise with <a href="${BASE}/leet/previous-year-papers/">past papers</a> and <a href="${BASE}/leet/mock-tests/">mock tests</a> on OneLeet.` },
    ];
    const f = faq(faqs);
    const otherStates = featuredStates.filter((x) => x.slug !== s.slug).slice(0, 6);
    const body = `
<p class="lead">Everything a ${esc(s.name)} diploma holder needs to move from polytechnic to a B.Tech degree through lateral entry — eligibility, subjects, and a preparation plan that fits around your final year.</p>
${ctaBlock(`Prepare for lateral entry in ${s.name} — free`, "Real past papers, exam-pattern mocks and AI practice, built for diploma students.")}
<section><h2>Lateral entry in ${esc(s.name)}: how it works</h2>
<p>${leetLine(`in ${esc(s.name)} turns a diploma into an engineering degree`)}</p>
<p>${authorityLine}</p>
<div class="note">Heads-up: exam names, dates, fees and cut-offs for ${esc(s.name)} change every year. OneLeet focuses on <em>preparation</em>; for application dates and seat details, always check the official ${esc(s.name)} notification.</div></section>
<section><h2>Eligibility at a glance</h2>
<p>Most ${esc(s.name)} aspirants qualify with a three-year engineering diploma and the minimum marks the state specifies. Reserved categories usually get a relaxation, and some states admit B.Sc (with Maths) candidates too. Read the full <a href="${BASE}/leet/eligibility/">LEET eligibility guide</a>.</p></section>
<section><h2>What to study</h2>
<p>The paper rewards clear fundamentals. Prioritise in this order and practise relentlessly:</p>
${cards(coreSubjects, subjectCard)}
${s.featured
        ? `<p style="margin-top:14px">Preparing for a specific subject in ${esc(s.name)}? Start here: ${coreSubjects.map((sub) => `<a href="${BASE}/leet/${s.slug}/${sub.slug}/">${esc(sub.name)} in ${esc(s.name)}</a>`).join(" · ")}.</p>`
        : `<p style="margin-top:14px">Go deeper on each subject: ${coreSubjects.map((sub) => `<a href="${BASE}/leet/subjects/${sub.slug}/">${esc(sub.name)}</a>`).join(" · ")}.</p>`}</section>
<section><h2>Your ${esc(s.name)} preparation plan</h2>
<ol>
<li><strong>Diagnose:</strong> attempt one real <a href="${BASE}/leet/previous-year-papers/">past paper</a> to see exactly what's asked.</li>
<li><strong>Build fundamentals:</strong> clear Mathematics and Physics topic by topic with <a href="${BASE}/leet/how-to-prepare/">this study plan</a>.</li>
<li><strong>Practise daily:</strong> use AI practice to drill weak areas, then take timed <a href="${BASE}/leet/mock-tests/">mock tests</a>.</li>
<li><strong>Analyse &amp; revise:</strong> review every mistake and revise with high-yield notes in the last month.</li>
</ol></section>
<section><h2>The opportunity, for ${esc(s.name)} students</h2>
<p>A lateral-entry B.Tech in ${esc(s.name)} means a full degree in two fewer years than starting fresh — and access to GATE, PSU and government roles, campus placements and higher studies. <a href="${BASE}/leet/${s.slug}/after-diploma/">See your after-diploma opportunity in ${esc(s.name)} →</a></p></section>
<section><h2>Other states</h2>${cards(otherStates, stateCard)}</section>
${f.html}`;
    await writePage(`/leet/${s.slug}`, layout({
        path: `/leet/${s.slug}/`,
        title: `${s.name} LEET — Lateral Entry into B.Tech after Diploma | OneLeet`,
        description: `Lateral entry (LEET) in ${s.name}: eligibility, subjects, exam pattern and a free preparation plan to get from your diploma into 2nd year B.Tech. Past papers, mocks & AI practice.`,
        eyebrow: `LEET · ${s.name}`,
        h1: `LEET in ${esc(s.name)}: diploma to B.Tech, the direct way`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: s.name, url: `/leet/${s.slug}/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.8, "monthly");
}

// ===========================================================================
// STATE after-diploma — /leet/:state/after-diploma
// ===========================================================================
async function buildStateAfterDiploma(s) {
    const faqs = [
        { q: `What are the options after a diploma in ${s.name}?`, a: `Take a job on your diploma, upgrade to B.Tech through <a href="${BASE}/leet/${s.slug}/">lateral entry in ${esc(s.name)}</a>, or restart a degree via JEE. Lateral entry is the quickest route to a full engineering degree because it credits your first year.` },
        { q: `Is lateral entry worth it in ${s.name}?`, a: `For most diploma holders, yes — a B.Tech unlocks higher salaries, GATE and government engineering posts, campus placements and higher studies, all in two fewer years than starting over. <a href="${BASE}/guides/is-lateral-entry-btech-worth-it/">Full breakdown →</a>` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">Just finished (or finishing) a polytechnic diploma in ${esc(s.name)}? Lateral entry is the fastest way to turn it into a full B.Tech — here's the opportunity and how to seize it.</p>
${ctaBlock(`Your B.Tech starts here, ${s.name}`, "Prepare for lateral entry free — real papers, mocks and AI practice for diploma students.")}
<section><h2>The opportunity, in plain terms</h2>
<p>${leetLine(`in ${esc(s.name)} upgrades a diploma into a degree`)} You skip the first year, so you graduate with a full B.Tech in three more years instead of four — the same degree, less time and cost.</p></section>
<section><h2>What it unlocks for you</h2>
<ul>
<li><strong>Better roles &amp; pay:</strong> a degree opens jobs and pay bands a diploma alone often can't.</li>
<li><strong>Government &amp; PSU paths:</strong> become eligible for GATE, PSU recruitment and degree-level engineering posts.</li>
<li><strong>Campus placements:</strong> sit for the same recruiters as any B.Tech student in ${esc(s.name)}.</li>
<li><strong>Higher studies:</strong> M.Tech, MBA and beyond become options.</li>
</ul></section>
<section><h2>How to grab it</h2>
<ol>
<li>Check your eligibility and the current process on the official ${esc(s.name)} notification, and read our <a href="${BASE}/leet/eligibility/">eligibility guide</a>.</li>
<li>Understand the <a href="${BASE}/leet/${s.slug}/">${esc(s.name)} lateral-entry route</a> and what the paper tests.</li>
<li>Prepare with <a href="${BASE}/leet/previous-year-papers/">past papers</a>, <a href="${BASE}/leet/mock-tests/">mock tests</a> and AI practice — for free on OneLeet.</li>
</ol></section>
<section><h2>Keep exploring</h2>
<div class="pill-row">
<a class="pill" href="${BASE}/leet/${s.slug}/">${esc(s.name)} LEET guide</a>
<a class="pill" href="${BASE}/guides/diploma-to-btech-complete-roadmap/">Diploma→B.Tech roadmap</a>
<a class="pill" href="${BASE}/guides/how-to-choose-your-btech-branch/">Choosing a branch</a>
<a class="pill" href="${BASE}/leet/colleges/">Target colleges</a>
</div></section>
${f.html}`;
    await writePage(`/leet/${s.slug}/after-diploma`, layout({
        path: `/leet/${s.slug}/after-diploma/`,
        title: `After Diploma in ${s.name}: Lateral Entry B.Tech Opportunity | OneLeet`,
        description: `What to do after a diploma in ${s.name}: how lateral entry (LEET) gets you into 2nd year B.Tech, the careers it unlocks, and how to prepare for free.`,
        eyebrow: `After diploma · ${s.name}`,
        h1: `After your diploma in ${esc(s.name)}: seize lateral entry`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: s.name, url: `/leet/${s.slug}/` }, { name: "After Diploma", url: `/leet/${s.slug}/after-diploma/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.8, "monthly");
}

// ===========================================================================
// STATE × SUBJECT — /leet/:state/:subject  (top states only)
// ===========================================================================
async function buildStateSubject(s, sub) {
    const topics = sub.topics;
    const faqs = [
        { q: `How important is ${sub.name} for lateral entry in ${s.name}?`, a: `${sub.name} is ${esc(sub.blurb)} — so for ${esc(s.name)} aspirants it's a section worth prioritising. Weightage varies by year; confirm the ${esc(s.name)} notification and practise with real papers.` },
        { q: `How do I practise ${sub.name} for ${s.name} LEET?`, a: `Learn each topic, then drill it with unlimited AI-generated questions and timed <a href="${BASE}/leet/mock-tests/">mock tests</a> on OneLeet, and review with <a href="${BASE}/leet/previous-year-papers/">past papers</a>.` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">A focused ${esc(sub.name)} plan for diploma students targeting lateral entry into B.Tech in ${esc(s.name)} — the topics that matter, in the order that works.</p>
<section><h2>Why ${esc(sub.name)} matters for ${esc(s.name)} aspirants</h2>
<p>For lateral entry in ${esc(s.name)}, ${esc(sub.name)} is ${esc(sub.blurb)}. Because it tests fundamentals you already met during your diploma, a little structured revision converts quickly into marks.</p>
<p>New to the ${esc(s.name)} process itself? Start with the <a href="${BASE}/leet/${s.slug}/">${esc(s.name)} lateral-entry guide</a>.</p></section>
<section><h2>${esc(sub.name)} topics to master</h2>
<div class="pill-row">${topics.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
<p>Go deeper on any topic in our <a href="${BASE}/leet/subjects/${sub.slug}/">${esc(sub.name)} subject guide</a>, which links a dedicated explainer and practice set for each.</p></section>
<section><h2>Practise ${esc(sub.name)} the OneLeet way</h2>
${featureStrip()}</section>
${ctaBlock(`Practise ${sub.name} for ${s.name} LEET`, "Unlimited AI questions, real past papers and timed mocks — free.")}
<section><h2>Related</h2>
<div class="pill-row">
${coreSubjects.filter((x) => x.slug !== sub.slug).map((x) => `<a class="pill" href="${BASE}/leet/${s.slug}/${x.slug}/">${esc(x.name)} in ${esc(s.name)}</a>`).join("")}
<a class="pill" href="${BASE}/leet/subjects/${sub.slug}/">${esc(sub.name)} (all states)</a>
</div></section>
${f.html}`;
    await writePage(`/leet/${s.slug}/${sub.slug}`, layout({
        path: `/leet/${s.slug}/${sub.slug}/`,
        title: `${sub.name} for ${s.name} LEET — Syllabus & Practice | OneLeet`,
        description: `${sub.name} preparation for lateral entry (LEET) in ${s.name}: the key topics, study order and free practice — past papers, AI questions and mock tests.`,
        eyebrow: `${s.name} · ${sub.name}`,
        h1: `${esc(sub.name)} for lateral entry in ${esc(s.name)}`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: s.name, url: `/leet/${s.slug}/` }, { name: sub.name, url: `/leet/${s.slug}/${sub.slug}/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.6, "monthly");
}

// ===========================================================================
// SUBJECTS hub + subject + topic
// ===========================================================================
async function buildSubjectsHub() {
    const body = `
<p class="lead">The LEET paper is won on fundamentals. Work through each section below — syllabus, highest-yield topics and unlimited practice.</p>
${cards(SUBJECTS, subjectCard)}
${ctaBlock()}
<section><h2>Not sure where to start?</h2>
<p>Begin with <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a> — it carries the most weight in almost every state — then layer in Physics and Chemistry. Follow the full sequence in our <a href="${BASE}/leet/how-to-prepare/">study plan</a>.</p></section>`;
    await writePage("/leet/subjects", layout({
        path: "/leet/subjects/",
        title: "LEET Subjects & Syllabus — Maths, Physics, Chemistry & More | OneLeet",
        description: "Every LEET / lateral-entry subject in one place: Mathematics, Physics, Chemistry, Engineering Mechanics and more — syllabus, key topics and free practice.",
        eyebrow: "Subjects", h1: "LEET subjects & syllabus",
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "Subjects", url: "/leet/subjects/" }],
        bodyHtml: body,
    }), 0.8, "monthly");
}

async function buildSubject(sub) {
    const topicLinks = sub.topics
        .map((t) => `<a class="card" href="${BASE}/leet/subjects/${sub.slug}/${slugify(t)}/"><h3>${esc(t)}</h3><p>Concept, formulae and practice questions for ${esc(t)}.</p></a>`)
        .join("");
    const faqs = [
        { q: `Is ${sub.name} important for LEET?`, a: `${sub.name} is ${esc(sub.blurb)}. Prioritise it and practise consistently with real papers and mocks.` },
        { q: `What are the key ${sub.name} topics for LEET?`, a: `The high-yield topics are: ${sub.topics.join(", ")}. Each has a dedicated explainer and practice set on OneLeet.` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">A complete ${esc(sub.name)} plan for LEET / lateral entry — the syllabus, the topics that actually score, and unlimited practice to lock them in.</p>
<section><h2>Why ${esc(sub.name)}?</h2><p>For LEET, ${esc(sub.name)} is ${esc(sub.blurb)}. Because the paper tests the engineering fundamentals your diploma already covered, structured revision here converts fast into marks.</p></section>
<section><h2>${esc(sub.name)} topics for LEET</h2><div class="grid">${topicLinks}</div></section>
${ctaBlock(`Practise ${sub.name} free`, "Unlimited AI-generated questions on any topic and difficulty, plus real past papers and timed mocks.")}
${sub.core ? `<section><h2>State-specific ${esc(sub.name)}</h2>
<div class="pill-row">${featuredStates.slice(0, 8).map((s) => `<a class="pill" href="${BASE}/leet/${s.slug}/${sub.slug}/">${esc(sub.name)} in ${esc(s.name)}</a>`).join("")}</div></section>` : ""}
<section><h2>Other subjects</h2>${cards(SUBJECTS.filter((x) => x.slug !== sub.slug), subjectCard)}</section>
${f.html}`;
    await writePage(`/leet/subjects/${sub.slug}`, layout({
        path: `/leet/subjects/${sub.slug}/`,
        title: `LEET ${sub.name} — Syllabus, Topics & Practice | OneLeet`,
        description: `${sub.name} for LEET / lateral entry: full syllabus, the highest-yield topics, and free practice with past papers, AI questions and mock tests.`,
        eyebrow: `Subject · ${sub.name}`, h1: `LEET ${esc(sub.name)}: syllabus, topics & practice`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "Subjects", url: "/leet/subjects/" }, { name: sub.name, url: `/leet/subjects/${sub.slug}/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.7, "monthly");
}

async function buildTopic(sub, topic) {
    const tslug = slugify(topic);
    const siblings = sub.topics.filter((t) => t !== topic).slice(0, 6);
    const faqs = [
        { q: `Is ${topic} asked in LEET?`, a: `${topic} is part of the ${sub.name} section that most LEET / lateral-entry papers draw from. Practise it with real questions and review it in your mock analysis.` },
        { q: `How do I master ${topic} quickly?`, a: `Understand the core idea, memorise the standard formulae, then drill 20–30 varied problems. OneLeet's AI can generate unlimited ${topic} questions at your level.` },
    ];
    const f = faq(faqs);
    const body = `
<p class="lead">${esc(topic)} is one of the scoring topics in LEET ${esc(sub.name)}. Here's what to know and how to practise it efficiently as a diploma student.</p>
<section><h2>${esc(topic)} in the LEET syllabus</h2>
<p>${esc(topic)} sits within <a href="${BASE}/leet/subjects/${sub.slug}/">${esc(sub.name)}</a>, ${esc(sub.blurb)}. In the exam it typically appears as direct, formula-driven questions — exactly the kind you can train for with repetition.</p>
<p>Approach it in three steps: (1) nail the underlying concept, (2) memorise the standard results and formulae, and (3) solve a spread of past-paper and AI-generated problems until the pattern is automatic.</p></section>
${ctaBlock(`Practise ${topic} now`, "Generate unlimited questions on this exact topic with OneLeet's AI, then test yourself with timed mocks — free.")}
<section><h2>Keep going in ${esc(sub.name)}</h2>
<div class="pill-row">${siblings.map((t) => `<a class="pill" href="${BASE}/leet/subjects/${sub.slug}/${slugify(t)}/">${esc(t)}</a>`).join("")}
<a class="pill" href="${BASE}/leet/subjects/${sub.slug}/">All ${esc(sub.name)} topics</a></div></section>
${f.html}`;
    await writePage(`/leet/subjects/${sub.slug}/${tslug}`, layout({
        path: `/leet/subjects/${sub.slug}/${tslug}/`,
        title: `${topic} for LEET ${sub.name} — Notes & Practice | OneLeet`,
        description: `${topic} for LEET / lateral entry (${sub.name}): what's asked, how to approach it, and unlimited free practice with AI questions and past papers.`,
        eyebrow: `${sub.name} · Topic`, h1: `${esc(topic)} — LEET ${esc(sub.name)}`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "Subjects", url: "/leet/subjects/" }, { name: sub.name, url: `/leet/subjects/${sub.slug}/` }, { name: topic, url: `/leet/subjects/${sub.slug}/${tslug}/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.6, "monthly");
}

// ===========================================================================
// COLLEGES hub + college
// ===========================================================================
async function buildCollegesHub() {
    const body = `
<p class="lead">Dreaming of a top engineering college through lateral entry? These institutions are popular lateral-entry targets. Learn how admission generally works and prepare to earn your seat.</p>
<div class="note">College participation, seat counts and cut-offs change every year and are decided by each state's counselling. Always confirm the current lateral-entry seats and process on the college's official admissions page.</div>
${cards(COLLEGES, collegeCard)}
${ctaBlock()}`;
    await writePage("/leet/colleges", layout({
        path: "/leet/colleges/",
        title: "Colleges for Lateral Entry B.Tech (LEET) — Target List | OneLeet",
        description: "Popular colleges for lateral entry into B.Tech across India — DTU, NSUT, Thapar, COEP, VJTI, BIT and more. How admission works and how to prepare for LEET.",
        eyebrow: "Colleges", h1: "Colleges for lateral entry into B.Tech",
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "Colleges", url: "/leet/colleges/" }],
        bodyHtml: body,
    }), 0.7, "monthly");
}

async function buildCollege(c) {
    const faqs = [
        { q: `Does ${c.name} accept lateral-entry students?`, a: `Many engineering institutions offer lateral-entry (second-year) seats to diploma holders through their state's counselling, subject to yearly seat availability. Always confirm ${esc(c.name)}'s current lateral-entry intake and process on its official admissions page.` },
        { q: `How do I prepare to get into ${c.name} via lateral entry?`, a: `Score well in your state's lateral-entry test. Build fundamentals in <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a>, Physics and Chemistry, and practise with <a href="${BASE}/leet/previous-year-papers/">past papers</a> and <a href="${BASE}/leet/mock-tests/">mock tests</a> on OneLeet.` },
    ];
    const f = faq(faqs);
    const img = `${BASE}/colleges/${c.img}`;
    const body = `
<p class="lead">Aiming for ${esc(c.name)} through lateral entry? Here's how admission generally works for diploma holders and how to prepare to earn your second-year seat.</p>
<img class="thumb" src="${img}" alt="${esc(c.name)}, ${esc(c.city)}" width="960" height="540" loading="lazy">
<section><h2>Lateral entry to ${esc(c.name)}</h2>
<p>${esc(c.name)} (${esc(c.city)}) is a sought-after destination for diploma holders. Lateral-entry seats — direct admission into the second year of B.Tech — are typically allotted through your state's lateral-entry counselling based on your entrance rank and preferences.</p>
<div class="note">Seat availability, participating branches and cut-offs at ${esc(c.name)} are set each year by the counselling authority. Confirm the latest details on the official ${esc(c.name)} / state counselling website before applying.</div></section>
<section><h2>How to earn your seat</h2>
<ol>
<li>Meet your state's lateral-entry eligibility (see the <a href="${BASE}/leet/eligibility/">eligibility guide</a>).</li>
<li>Score a strong rank in the lateral-entry test — that's what decides allotment.</li>
<li>Prepare with OneLeet: <a href="${BASE}/leet/previous-year-papers/">past papers</a>, <a href="${BASE}/leet/mock-tests/">mock tests</a> and AI practice, free.</li>
<li>Fill preferences carefully in counselling with ${esc(c.name)} listed where it fits your rank.</li>
</ol></section>
${ctaBlock(`Prepare to crack lateral entry`, "The seat goes to the rank. Build yours with real papers, mocks and AI practice — free.")}
<section><h2>Other colleges</h2>${cards(COLLEGES.filter((x) => x.slug !== c.slug).slice(0, 6), collegeCard)}</section>
${f.html}`;
    await writePage(`/leet/colleges/${c.slug}`, layout({
        path: `/leet/colleges/${c.slug}/`,
        title: `${c.name} Lateral Entry (LEET) — Admission & Prep | OneLeet`,
        description: `Lateral entry into ${c.name}, ${c.city}: how second-year B.Tech admission for diploma holders generally works, and how to prepare with free past papers and mock tests.`,
        eyebrow: `College · ${c.city}`, h1: `Lateral entry to ${esc(c.name)}`,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: "Colleges", url: "/leet/colleges/" }, { name: c.name, url: `/leet/colleges/${c.slug}/` }],
        bodyHtml: body, jsonld: [f.jsonld],
    }), 0.6, "monthly");
}

// ===========================================================================
// UTILITY hubs (eligibility, syllabus, exam-pattern, pyqs, mocks, prepare, books, cutoff)
// ===========================================================================
async function buildUtilities() {
    const U = [
        {
            slug: "eligibility", h1: "LEET eligibility: who can apply for lateral entry",
            title: "LEET Eligibility 2025 — Lateral Entry into B.Tech | OneLeet",
            desc: "Who is eligible for LEET / lateral entry into 2nd year B.Tech: diploma criteria, minimum marks, B.Sc route and category relaxations — explained simply.",
            eyebrow: "Eligibility",
            body: `<p class="lead">Can you apply for lateral entry? In most states, if you hold (or are completing) a three-year engineering diploma, the answer is yes. Here are the common rules.</p>
<section><h2>General eligibility</h2>
<ul>
<li><strong>Engineering diploma:</strong> a three-year (or equivalent) diploma in engineering/technology from a recognised board is the core requirement.</li>
<li><strong>Minimum marks:</strong> usually around 45–50% aggregate, with a relaxation (often ~5%) for reserved categories. The exact figure is set by each state.</li>
<li><strong>B.Sc route:</strong> several states also admit B.Sc graduates (with Mathematics as a subject) into the second year.</li>
<li><strong>Appearing candidates:</strong> final-year diploma students can usually apply, subject to passing before admission.</li>
</ul>
<div class="note">These are the <em>common</em> patterns. The precise percentage, eligible branches, domicile and reservation rules vary by state and change yearly — always verify the official notification for your state.</div></section>
<section><h2>Find your state's rules</h2>${cards(featuredStates, stateCard)}</section>
${ctaBlock()}`,
            faqs: [
                { q: "What percentage is needed for lateral entry?", a: "Most states ask for roughly 45–50% in your diploma, relaxed for reserved categories. Confirm your state's exact cut-off in its notification." },
                { q: "Can B.Sc students apply for lateral entry?", a: "In several states, yes — B.Sc graduates with Mathematics can take lateral entry into the second year of B.Tech. Check your state's rules." },
            ],
        },
        {
            slug: "syllabus", h1: "LEET syllabus: what to actually study",
            title: "LEET Syllabus — Subjects & Topics for Lateral Entry | OneLeet",
            desc: "The LEET / lateral-entry syllabus: Mathematics, Physics, Chemistry and core engineering subjects, with the highest-yield topics and where to focus first.",
            eyebrow: "Syllabus",
            body: `<p class="lead">Most LEET / lateral-entry papers test the engineering fundamentals your diploma already covered. Here's the syllabus, and the order to study it.</p>
<section><h2>Core subjects</h2>${cards(coreSubjects, subjectCard)}</section>
<section><h2>Also commonly tested</h2>${cards(SUBJECTS.filter((s) => !s.core), subjectCard)}</section>
<div class="note">Exact subjects and weightage vary by state. Use this as a study map, and confirm your state's official syllabus.</div>
${ctaBlock()}`,
            faqs: [
                { q: "What is the LEET syllabus?", a: "Broadly Mathematics, Physics, Chemistry and core engineering subjects such as Engineering Mechanics and Basic Electrical Engineering; some states add English and aptitude." },
                { q: "Which subject has the most weight in LEET?", a: "Mathematics usually carries the most weight and is the most predictable — start there." },
            ],
        },
        {
            slug: "exam-pattern", h1: "LEET exam pattern & marking scheme",
            title: "LEET Exam Pattern & Marking — Lateral Entry | OneLeet",
            desc: "How the LEET / lateral-entry paper is set: number of questions, section split, duration and negative marking, plus how to plan your attempt.",
            eyebrow: "Exam pattern",
            body: `<p class="lead">Knowing the pattern lets you plan your attempt. Here's what a LEET / lateral-entry paper generally looks like.</p>
<section><h2>What to expect</h2>
<ul>
<li><strong>Format:</strong> objective, multiple-choice questions (MCQs).</li>
<li><strong>Sections:</strong> usually Mathematics-heavy, plus Physics, Chemistry and/or core engineering.</li>
<li><strong>Duration:</strong> commonly around 90–120 minutes.</li>
<li><strong>Negative marking:</strong> some states apply it, some don't — check your notification and plan your guessing accordingly.</li>
</ul>
<div class="note">Exact question counts, marks and negative-marking rules vary by state and year. Confirm the official pattern, then rehearse it with timed mocks.</div></section>
<section><h2>Rehearse the real thing</h2><p>The best way to internalise the pattern is to take <a href="${BASE}/leet/mock-tests/">exam-pattern mock tests</a> and review every mistake.</p></section>
${ctaBlock()}`,
            faqs: [
                { q: "Is there negative marking in LEET?", a: "It depends on the state — some apply negative marking, others don't. Always check the current notification and adjust your attempt strategy." },
                { q: "How long is the LEET exam?", a: "Typically around 90–120 minutes of objective questions, though this varies by state." },
            ],
        },
        {
            slug: "previous-year-papers", h1: "LEET previous year papers (PYQs)", pr: 0.85,
            title: "LEET Previous Year Papers (PYQs) — Free Practice | OneLeet",
            desc: "Practise real LEET / lateral-entry previous year question papers (PYQs). See exactly what's asked and train on the real pattern — free on OneLeet.",
            eyebrow: "Past papers",
            body: `<p class="lead">Nothing prepares you like the real thing. Previous year papers show you exactly what LEET asks — and reveal what you can safely ignore.</p>
<section><h2>Why past papers beat everything else</h2>
<p>Thick guides cover far more than the exam needs. Past papers cut straight to what's actually tested, so your hours go where the marks are. Attempt one early to diagnose your level, then use them to benchmark your progress.</p></section>
${ctaBlock("Practise real LEET papers free", "Sign up to access past papers, timed mocks and AI practice built around the real exam.")}
<section><h2>Turn practice into ranks</h2>${featureStrip()}</section>`,
            faqs: [
                { q: "Where can I find LEET previous year papers?", a: `Create a free OneLeet account to practise past papers and exam-pattern mock tests. <a href="${BASE}/register">Get started →</a>` },
                { q: "How many past papers should I solve?", a: "Solve as many as you can, but analyse each one deeply — reviewing mistakes matters more than raw volume." },
            ],
        },
        {
            slug: "mock-tests", h1: "LEET mock tests: rehearse exam day", pr: 0.85,
            title: "LEET Mock Tests — Free Exam-Pattern Practice | OneLeet",
            desc: "Take free exam-pattern LEET mock tests: timed, instantly scored, every mistake explained. Build speed and accuracy for lateral entry into B.Tech.",
            eyebrow: "Mock tests",
            body: `<p class="lead">Mock tests turn knowledge into a rank. Timed, exam-pattern practice builds the speed, accuracy and temperament the real paper demands.</p>
<section><h2>How to use mocks well</h2>
<ol>
<li>Take them timed, in one sitting, like the real exam.</li>
<li>Score instantly and read the explanation for every question — right or wrong.</li>
<li>Log recurring mistakes and convert them into revision.</li>
<li>Repeat weekly, then twice a week in the final month.</li>
</ol></section>
${ctaBlock("Take a LEET mock test free", "Timed, exam-pattern mocks with instant scoring and explanations. Plus AI practice and past papers.")}`,
            faqs: [
                { q: "Are OneLeet mock tests free?", a: `Yes — create a free account to take exam-pattern mock tests, with instant scoring and explanations. <a href="${BASE}/register">Start now →</a>` },
                { q: "How many mocks should I take before LEET?", a: "Build up to at least one full mock a week, then two a week in the last month — always with careful analysis afterwards." },
            ],
        },
        {
            slug: "how-to-prepare", h1: "How to prepare for LEET: a study plan that works",
            title: "How to Prepare for LEET — Step-by-Step Study Plan | OneLeet",
            desc: "A realistic, coaching-free LEET study plan for diploma students: what to study first, how to practise, and how to peak in the final month.",
            eyebrow: "Study plan",
            body: `<p class="lead">You don't need expensive coaching to crack LEET — you need the right sequence and honest practice. Here's a plan that fits around your diploma.</p>
<section><h2>The four phases</h2>
<ol>
<li><strong>Diagnose (week 1):</strong> attempt one <a href="${BASE}/leet/previous-year-papers/">past paper</a> to see the real standard and your gaps.</li>
<li><strong>Build fundamentals:</strong> clear <a href="${BASE}/leet/subjects/mathematics/">Maths</a>, <a href="${BASE}/leet/subjects/physics/">Physics</a> and <a href="${BASE}/leet/subjects/chemistry/">Chemistry</a> topic by topic, practising as you go.</li>
<li><strong>Practise &amp; test:</strong> drill weak topics with AI practice, then take weekly <a href="${BASE}/leet/mock-tests/">mock tests</a>.</li>
<li><strong>Peak (last 30 days):</strong> revise high-yield notes, take mocks twice a week, and fix repeat mistakes. <a href="${BASE}/guides/last-30-days-leet-revision-plan/">The 30-day plan →</a></li>
</ol></section>
${ctaBlock()}
<section><h2>More guides</h2>${cards(GUIDES.slice(2, 8), guideCard)}</section>`,
            faqs: [
                { q: "Can I crack LEET without coaching?", a: `Yes. A structured self-study plan with past papers, mocks and AI practice is enough for most students. <a href="${BASE}/guides/leet-preparation-without-coaching/">See the no-coaching blueprint →</a>` },
                { q: "How many months of preparation does LEET need?", a: "It varies, but 3–6 focused months alongside your diploma is a realistic target for most aspirants." },
            ],
        },
        {
            slug: "best-books", h1: "Best books & resources for LEET preparation",
            title: "Best Books & Resources for LEET Preparation | OneLeet",
            desc: "How to choose LEET books and resources: why past papers beat thick guides, and how to combine notes, mocks and AI practice for faster results.",
            eyebrow: "Resources",
            body: `<p class="lead">The right resource isn't the thickest book — it's the one that gets you to the exam pattern fastest. Here's how to choose.</p>
<section><h2>What actually helps</h2>
<ul>
<li><strong>Past papers first:</strong> they define the target. Everything else supports them.</li>
<li><strong>One solid reference per subject:</strong> a standard diploma-level text for Maths, Physics and Chemistry is plenty.</li>
<li><strong>Concise notes for revision:</strong> high-yield notes and flashcards beat re-reading textbooks in the final month.</li>
<li><strong>Active practice:</strong> AI-generated questions and timed mocks turn reading into recall.</li>
</ul></section>
${ctaBlock("Skip the guesswork — practise smart", "Past papers, notes, mocks and AI practice in one free platform.")}`,
            faqs: [
                { q: "Which is the best book for LEET?", a: "There's no single 'best' book — a standard diploma-level text per subject plus real past papers and mocks covers what LEET needs." },
                { q: "Do I need coaching material for LEET?", a: "No. Past papers, structured notes and exam-pattern mocks (all on OneLeet) replace expensive coaching material for most students." },
            ],
        },
        {
            slug: "cutoff", h1: "LEET cut-off: how ranks and seats work",
            title: "LEET Cut-off & Rank — How Lateral Entry Seats Work | OneLeet",
            desc: "How LEET cut-offs and lateral-entry seat allotment work, why cut-offs change every year, and how to build a rank that gets you the college you want.",
            eyebrow: "Cut-off & rank",
            body: `<p class="lead">Cut-offs decide who gets which seat — but they aren't fixed numbers to memorise. Here's how they actually work, and how to beat them.</p>
<section><h2>What a cut-off really is</h2>
<p>A cut-off is simply the last rank that received a seat in a given college-and-branch during counselling. It emerges from that year's difficulty, number of applicants and seat count — so it shifts every year and can't be predicted precisely in advance.</p>
<div class="note">Don't chase last year's numbers. They're a rough guide at best. Confirm official cut-offs and seat matrices on your state's counselling portal.</div></section>
<section><h2>The only reliable strategy: rank higher</h2>
<p>Since cut-offs move, the one thing in your control is your rank. Build it with fundamentals, <a href="${BASE}/leet/previous-year-papers/">past papers</a> and <a href="${BASE}/leet/mock-tests/">mocks</a> — then fill counselling preferences smartly.</p></section>
${ctaBlock()}`,
            faqs: [
                { q: "What is a good rank for lateral entry?", a: "It depends on your state, the college and the branch — and it changes yearly. Aim as high as you can; the rank is the one thing you control." },
                { q: "How are LEET cut-offs decided?", a: "They emerge from each year's paper difficulty, applicant numbers and seat availability during counselling — which is why they vary annually." },
            ],
        },
    ];
    for (const u of U) {
        const f = faq(u.faqs);
        await writePage(`/leet/${u.slug}`, layout({
            path: `/leet/${u.slug}/`,
            title: u.title, description: u.desc, eyebrow: u.eyebrow, h1: u.h1,
            crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "LEET Guide", url: "/leet/" }, { name: u.eyebrow, url: `/leet/${u.slug}/` }],
            bodyHtml: u.body + f.html, jsonld: [f.jsonld],
        }), u.pr || 0.8, "monthly");
    }
}

// ===========================================================================
// GUIDES — /guides/:slug
// ===========================================================================
const GUIDE_BODY = {
    "what-is-leet-lateral-entry": `
<p class="lead">If you've finished an engineering diploma and keep hearing about "lateral entry" or "LEET", this is the plain-English explanation.</p>
<section><h2>LEET in one sentence</h2><p>${/*definition*/""}The <strong>Lateral Entry Entrance Test (LEET)</strong> is the admission route that lets a diploma holder join a B.Tech / B.E. degree directly in the <strong>second year</strong>, skipping the first.</p></section>
<section><h2>Why it exists</h2><p>Your three-year diploma already teaches the first-year engineering fundamentals — maths, physics, basic engineering — so it would be wasteful to repeat them. Lateral entry credits that year and drops you straight into year two.</p></section>
<section><h2>How you get in</h2><p>Each state runs its own process — an entrance test (called LEET, DSE, JELET, ECET, D2D and other names) and/or merit-based counselling. You apply, sit the test, and are allotted a second-year seat by rank. See <a href="${BASE}/leet/eligibility/">eligibility</a> and <a href="${BASE}/leet/exam-pattern/">exam pattern</a>.</p></section>
<section><h2>Is the degree the same?</h2><p>Yes — you graduate with an identical B.Tech / B.E. <a href="${BASE}/guides/lateral-entry-vs-regular-btech/">More on that here</a>.</p></section>`,
    "bihar-leet-opportunity-after-diploma": `
<p class="lead">Finished a polytechnic diploma in Bihar? Lateral entry is your fastest route to a full B.Tech — and it's more within reach than most students realise.</p>
${ctaBlock("Start your Bihar lateral-entry prep", "Real past papers, mocks and AI practice — free, for Bihar diploma holders.")}
<section><h2>The opportunity</h2><p>Through lateral entry, a Bihar diploma holder joins the <strong>second year</strong> of B.Tech directly. In Bihar, lateral-entry admission is typically handled via the <strong>Bihar Combined Entrance Competitive Examination Board (BCECEB)</strong> lateral-entry process — but exam names, dates and rules change yearly, so always confirm the current official notification.</p></section>
<section><h2>Why it's worth it</h2><ul>
<li>A full engineering degree in <strong>two fewer years</strong> than starting over.</li>
<li>Eligibility for GATE, PSU recruitment and government engineering posts.</li>
<li>Campus placements and higher studies (M.Tech, MBA).</li>
<li>You keep the hands-on edge your polytechnic training gave you.</li></ul></section>
<section><h2>How to prepare</h2><p>Prioritise <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a>, then Physics and Chemistry, and practise relentlessly with <a href="${BASE}/leet/previous-year-papers/">past papers</a> and <a href="${BASE}/leet/mock-tests/">mock tests</a>. Full walkthrough: <a href="${BASE}/leet/bihar/">Bihar LEET guide</a> and <a href="${BASE}/leet/bihar/after-diploma/">Bihar after-diploma opportunity</a>.</p></section>`,
    "how-to-prepare-for-leet": `
<p class="lead">A realistic LEET study plan you can run alongside your diploma — no coaching required.</p>
<section><h2>Start with a real paper</h2><p>Before you study anything, attempt one <a href="${BASE}/leet/previous-year-papers/">past paper</a>. It shows the real standard and exactly where your gaps are, so you don't waste weeks on the wrong things.</p></section>
<section><h2>Build fundamentals in order</h2><p>Clear <a href="${BASE}/leet/subjects/mathematics/">Maths</a> first (highest weight), then <a href="${BASE}/leet/subjects/physics/">Physics</a> and <a href="${BASE}/leet/subjects/chemistry/">Chemistry</a>, practising each topic as you learn it.</p></section>
<section><h2>Practise, test, analyse</h2><p>Use AI practice to drill weak topics, take weekly <a href="${BASE}/leet/mock-tests/">mocks</a>, and — most importantly — analyse every mistake. In the last month, mock twice a week. <a href="${BASE}/guides/last-30-days-leet-revision-plan/">The 30-day plan →</a></p></section>`,
    "leet-vs-jee-which-path-after-diploma": `
<p class="lead">Diploma done — should you attempt lateral entry (LEET) or restart with JEE? Here's an honest comparison.</p>
<section><h2>Time &amp; cost</h2><p>Lateral entry gets you a degree in <strong>three more years</strong> (you enter year two). JEE means <strong>four years</strong> from year one. Lateral entry is faster and usually cheaper overall.</p></section>
<section><h2>Competition</h2><p>In lateral entry you compete with fellow diploma holders for dedicated seats. In JEE you compete with lakhs of Class 12 students. For most diploma holders, lateral entry is the more winnable field.</p></section>
<section><h2>When JEE might make sense</h2><p>If you're targeting a specific institute that only admits at year one, JEE could be the route. Otherwise, lateral entry is the efficient path. Compare with the <a href="${BASE}/leet/">LEET guide</a>.</p></section>`,
    "lateral-entry-vs-regular-btech": `
<p class="lead">Does a lateral-entry B.Tech carry the same value as a regular four-year degree? Short answer: yes.</p>
<section><h2>The degree is identical</h2><p>You graduate with the same B.Tech / B.E. from the same university. The certificate does <strong>not</strong> label you a lateral-entry student.</p></section>
<section><h2>What actually differs</h2><p>Only the entry point. You join in year two, so you skip first-year subjects your diploma already covered. You'll want to bridge any gaps (some universities offer bridge courses) — but you finish alongside everyone else.</p></section>
<section><h2>What recruiters see</h2><p>Recruiters see your degree, your skills and your projects — not your entry route. Your diploma's hands-on training is often an advantage. <a href="${BASE}/guides/is-lateral-entry-btech-worth-it/">Is it worth it? →</a></p></section>`,
    "is-lateral-entry-btech-worth-it": `
<p class="lead">Career scope, higher studies and jobs for a diploma holder who upgrades to B.Tech through lateral entry.</p>
<section><h2>Career &amp; salary</h2><p>A B.Tech widens the roles and pay bands open to you well beyond a diploma alone — in IT, core engineering and beyond.</p></section>
<section><h2>Government &amp; PSU</h2><p>A degree makes you eligible for GATE, PSU recruitment and many government engineering posts that require a B.Tech.</p></section>
<section><h2>Higher studies</h2><p>M.Tech, MBA and research paths open up. For two extra years of study (versus a fresh degree's four), the return is strong for most students.</p></section>
${ctaBlock()}`,
    "diploma-to-btech-complete-roadmap": `
<p class="lead">Every step from your final diploma semester to a B.Tech seat via lateral entry.</p>
<section><h2>1. Check eligibility</h2><p>Confirm your diploma and marks meet your state's lateral-entry criteria — see the <a href="${BASE}/leet/eligibility/">eligibility guide</a>.</p></section>
<section><h2>2. Learn the exam</h2><p>Understand the <a href="${BASE}/leet/syllabus/">syllabus</a> and <a href="${BASE}/leet/exam-pattern/">pattern</a> for your state.</p></section>
<section><h2>3. Prepare</h2><p>Follow a <a href="${BASE}/leet/how-to-prepare/">study plan</a>, practise <a href="${BASE}/leet/previous-year-papers/">past papers</a> and take <a href="${BASE}/leet/mock-tests/">mocks</a>.</p></section>
<section><h2>4. Apply &amp; sit the test</h2><p>Apply through the official notification, then sit the lateral-entry test.</p></section>
<section><h2>5. Counselling</h2><p>Attend counselling with documents ready and fill preferences smartly. <a href="${BASE}/guides/leet-counselling-and-documents/">Counselling &amp; documents →</a></p></section>`,
    "leet-syllabus-overview": `
<p class="lead">What to actually study for LEET, and where to start.</p>
<section><h2>The core</h2><p>Mathematics (highest weight), Physics and Chemistry form the backbone, alongside core engineering subjects like Engineering Mechanics and Basic Electrical Engineering. Explore each in the <a href="${BASE}/leet/subjects/">subjects hub</a>.</p></section>
<section><h2>Start smart</h2><p>Begin with <a href="${BASE}/leet/subjects/mathematics/">Mathematics</a> — it's the most predictable and highest-scoring section. Full map: <a href="${BASE}/leet/syllabus/">LEET syllabus</a>.</p></section>`,
    "leet-exam-pattern-and-marking": `
<p class="lead">How the LEET paper is generally set, and how to plan your attempt.</p>
<section><h2>Format</h2><p>Objective MCQs, Maths-heavy, usually 90–120 minutes. Negative marking varies by state. Full detail: <a href="${BASE}/leet/exam-pattern/">exam pattern</a>.</p></section>
<section><h2>Attempt strategy</h2><p>Bank the Maths and your strongest subject first, then attack the rest. If there's negative marking, avoid wild guesses. Rehearse it all with <a href="${BASE}/leet/mock-tests/">timed mocks</a>.</p></section>`,
    "leet-counselling-and-documents": `
<p class="lead">How lateral-entry counselling usually works — and the documents to keep ready.</p>
<section><h2>The counselling flow</h2><p>After results, you register for counselling, fill college/branch preferences, and are allotted a seat by rank. Report to the college to confirm.</p></section>
<section><h2>Documents checklist</h2><ul><li>Diploma marksheets &amp; certificate</li><li>Entrance-test rank/score card</li><li>Category / domicile certificates (if applicable)</li><li>ID proof and photographs</li></ul>
<div class="note">Exact documents and steps vary by state — follow your official counselling notification precisely.</div></section>`,
    "best-books-for-leet-preparation": `
<p class="lead">How to choose LEET resources without wasting money.</p>
<section><h2>Past papers over thick guides</h2><p>Past papers define what's tested. One solid diploma-level reference per subject plus real papers and mocks beats a shelf of coaching books. See <a href="${BASE}/leet/best-books/">resources</a>.</p></section>`,
    "how-to-choose-your-btech-branch": `
<p class="lead">CSE, ECE, Mechanical, Civil or your diploma trade? How to pick a lateral-entry branch.</p>
<section><h2>Match your diploma — or pivot</h2><p>Staying in your diploma trade means you're already ahead on fundamentals. Pivoting (e.g., to CSE) is possible where seats allow, but expect to bridge gaps. Weigh interest, seats and career goals.</p></section>
<section><h2>Then earn the rank</h2><p>Your branch options are decided by your rank in counselling — so preparation is what really widens your choices. <a href="${BASE}/leet/how-to-prepare/">Study plan →</a></p></section>`,
    "common-mistakes-in-leet-preparation": `
<p class="lead">The avoidable errors that quietly cost diploma students marks and ranks.</p>
<section><h2>The big seven</h2><ul>
<li>Never attempting a real <a href="${BASE}/leet/previous-year-papers/">past paper</a> early.</li>
<li>Studying everything, prioritising nothing (ignoring that <a href="${BASE}/leet/subjects/mathematics/">Maths</a> scores most).</li>
<li>Passive reading instead of active practice.</li>
<li>Taking mocks but not analysing mistakes.</li>
<li>Cramming new topics in the last week instead of revising.</li>
<li>Ignoring the official notification and missing dates/rules.</li>
<li>Believing you need costly coaching to succeed.</li></ul></section>
${ctaBlock()}`,
    "leet-preparation-without-coaching": `
<p class="lead">A self-study blueprint for LEET — no expensive classes required.</p>
<section><h2>The blueprint</h2><ol>
<li>Diagnose with a <a href="${BASE}/leet/previous-year-papers/">past paper</a>.</li>
<li>Clear fundamentals via the <a href="${BASE}/leet/subjects/">subject guides</a>.</li>
<li>Drill weak spots with unlimited AI practice.</li>
<li>Take weekly <a href="${BASE}/leet/mock-tests/">mocks</a> and analyse them.</li>
<li>Revise high-yield notes in the last month.</li></ol></section>
<section><h2>Everything in one place</h2>${featureStrip()}</section>${ctaBlock("Prepare free, no coaching", "Past papers, notes, mocks and AI practice — all in one platform.")}`,
    "last-30-days-leet-revision-plan": `
<p class="lead">A focused four-week plan for the final stretch before LEET.</p>
<section><h2>Weeks 4–3</h2><p>Revise high-yield <a href="${BASE}/leet/subjects/mathematics/">Maths</a> and Physics topics; one <a href="${BASE}/leet/mock-tests/">mock</a> mid-week, analysed fully.</p></section>
<section><h2>Weeks 2–1</h2><p>Two mocks a week under exam conditions. Convert every repeat mistake into a revision card. Sharpen speed and accuracy — no new topics.</p></section>
<section><h2>Final days</h2><p>Light revision, sleep well, keep documents ready per the <a href="${BASE}/guides/leet-counselling-and-documents/">checklist</a>. Walk in calm.</p></section>${ctaBlock()}`,
};

async function buildGuide(g) {
    const related = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 4);
    const body = (GUIDE_BODY[g.slug] || `<p class="lead">${esc(g.desc)}</p>${ctaBlock()}`) +
        `<hr><section><h2>Read next</h2>${cards(related, guideCard)}</section>`;
    const jsonld = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: g.title,
        description: g.desc,
        author: { "@type": "Organization", name: BRAND, url: `${BASE}/` },
        publisher: { "@id": `${BASE}/#organization` },
        mainEntityOfPage: url(`/guides/${g.slug}/`),
        image: `${BASE}/og-image.png`,
        inLanguage: "en-IN",
        dateModified: TODAY,
    };
    await writePage(`/guides/${g.slug}`, layout({
        path: `/guides/${g.slug}/`,
        title: `${g.title} | OneLeet`,
        description: g.desc, eyebrow: "Guide", h1: g.title,
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "Guides", url: `/guides/` }, { name: g.title.length > 34 ? g.title.slice(0, 32) + "…" : g.title, url: `/guides/${g.slug}/` }],
        bodyHtml: body, jsonld: [jsonld],
    }), 0.7, "monthly");
}

async function buildGuidesHub() {
    const body = `<p class="lead">Straight answers to the questions every diploma student asks about LEET and lateral entry into B.Tech.</p>${cards(GUIDES, guideCard)}${ctaBlock()}`;
    await writePage("/guides", layout({
        path: "/guides/",
        title: "LEET Guides — Lateral Entry into B.Tech, Answered | OneLeet",
        description: "Guides on LEET and lateral entry into B.Tech: what it is, eligibility, LEET vs JEE, choosing a branch, preparation without coaching and more.",
        eyebrow: "Guides", h1: "LEET & lateral-entry guides",
        crumbs: [{ name: "Home", url: `${BASE}/` }, { name: "Guides", url: "/guides/" }],
        bodyHtml: body,
    }), 0.8, "monthly");
}

// ===========================================================================
// sitemap.xml, robots.txt, llms.txt
// ===========================================================================
async function writeRootFile(name, content) {
    await writeFile(resolve(PUBLIC, name), content);
}

async function buildSitemap() {
    // Public SPA routes worth indexing, plus every generated static page.
    const spaRoutes = [
        { path: "/", priority: 1.0, changefreq: "weekly" },
        { path: "/mentor", priority: 0.5, changefreq: "monthly" },
    ];
    const all = [...spaRoutes, ...pages].sort((a, b) => b.priority - a.priority);
    const body = all
        .map(
            (p) =>
                `  <url><loc>${BASE}${p.path}</loc><lastmod>${TODAY}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority.toFixed(1)}</priority></url>`
        )
        .join("\n");
    await writeRootFile(
        "sitemap.xml",
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
    );
}

async function buildRobots() {
    // Explicitly WELCOME the major AI answer-engine crawlers (many sites block
    // them; we want OneLeet cited when someone asks an AI about LEET), while
    // keeping authenticated app routes out of the index.
    const txt = `# OneLeet — https://www.oneleet.in
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /studio
Disallow: /profile
Disallow: /analytics
Disallow: /leaderboard
Disallow: /community
Disallow: /tests/
Disallow: /ai-tools
Disallow: /verify-otp
Disallow: /reset-password
Disallow: /forgot-password

# AI answer engines — explicitly allowed
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: CCBot
Allow: /
User-agent: Bytespider
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: Bingbot
Allow: /

Sitemap: ${BASE}/sitemap.xml
`;
    await writeRootFile("robots.txt", txt);
}

async function buildLlms() {
    // Emerging llms.txt convention — a clean, linkable map for AI tools.
    const line = (p, label) => `- [${label}](${BASE}${p})`;
    const txt = `# OneLeet

> OneLeet is an AI-powered preparation platform for the LEET (Lateral Entry Entrance Test), which lets diploma holders in India get direct admission into the 2nd year of a B.Tech / B.E. degree. OneLeet offers real previous-year papers, exam-pattern mock tests, notes and unlimited AI practice. A unit of StaplerLabs Private Limited.

## Start here
${line("/leet/", "LEET preparation guide (pillar)")}
${line("/leet/after-diploma/", "Opportunities after a diploma (lateral entry)")}
${line("/leet/eligibility/", "LEET eligibility")}
${line("/leet/syllabus/", "LEET syllabus")}
${line("/leet/exam-pattern/", "LEET exam pattern & marking")}
${line("/leet/how-to-prepare/", "How to prepare for LEET")}

## Practice
${line("/leet/previous-year-papers/", "LEET previous year papers")}
${line("/leet/mock-tests/", "LEET mock tests")}
${line("/leet/subjects/", "Subjects & topics")}

## Popular states
${STATES.filter((s) => s.featured).map((s) => line(`/leet/${s.slug}/`, `LEET in ${s.name}`)).join("\n")}

## Guides
${GUIDES.map((g) => line(`/guides/${g.slug}/`, g.title)).join("\n")}
`;
    await writeRootFile("llms.txt", txt);
}

// ===========================================================================
// RUN
// ===========================================================================
async function main() {
    // Clean prior generated output so removed pages don't linger.
    for (const d of ["leet", "guides"]) {
        const p = resolve(PUBLIC, d);
        if (existsSync(p)) await rm(p, { recursive: true, force: true });
    }

    await buildPillar();
    await buildAfterDiplomaPillar();
    await buildUtilities();
    await buildSubjectsHub();
    await buildCollegesHub();
    await buildGuidesHub();

    for (const s of STATES) {
        await buildState(s);
        await buildStateAfterDiploma(s);
    }
    // State × subject for the featured states (core subjects only) — genuinely
    // differentiated (state context × subject syllabus), not thin duplication.
    for (const s of featuredStates) {
        for (const sub of coreSubjects) await buildStateSubject(s, sub);
    }
    for (const sub of SUBJECTS) {
        await buildSubject(sub);
        // Topic explainers — the deepest long-tail layer.
        for (const t of sub.topics) await buildTopic(sub, t);
    }
    for (const c of COLLEGES) await buildCollege(c);
    for (const g of GUIDES) await buildGuide(g);

    await buildSitemap();
    await buildRobots();
    await buildLlms();

    console.log(`\n✅ OneLeet SEO generated`);
    console.log(`   ${pages.length} landing pages`);
    console.log(`   + sitemap.xml, robots.txt, llms.txt`);
    console.log(`   base: ${BASE}\n`);
}

main().catch((e) => {
    console.error("SEO generation failed:", e);
    process.exit(1);
});
