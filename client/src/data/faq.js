// LEET / lateral-entry FAQ — the questions diploma students actually search.
// Single source of truth for the home-page FAQ section AND its FAQPage schema.
// Answers are evergreen and honest (exam rules vary by state and year), keyword
// -rich for search, and lead naturally to OneLeet. Keep them plain text.

export const LEET_FAQ = [
    {
        q: "What is lateral entry after a diploma?",
        a: "Lateral entry lets a diploma holder join a B.Tech / B.E. degree directly in the second year, skipping the first. Admission is through a Lateral Entry Entrance Test (LEET) or merit counselling run by each state. Because your three-year diploma already covers the first-year fundamentals, you finish a full engineering degree in three more years instead of four.",
    },
    {
        q: "Am I eligible for LEET / lateral entry after diploma?",
        a: "In most states, if you hold (or are completing) a three-year engineering diploma with roughly 45 to 50 percent marks, you are eligible. Reserved categories usually get a relaxation, and several states also admit B.Sc graduates with Mathematics. The exact percentage, eligible branches and domicile rules are set by each state, so always confirm your state's official notification.",
    },
    {
        q: "Which are the best colleges after diploma through lateral entry?",
        a: "Through lateral entry you can reach the same top B.Tech colleges as regular entry, including DTU, NSUT, IPU-affiliated colleges, VJTI and many strong state universities. The best college for you depends on your rank, category and state. OneLeet's college lists and previous-year cut-offs help you see realistic targets for your expected score.",
    },
    {
        q: "Which B.Tech colleges accept lateral entry in Delhi?",
        a: "In Delhi, diploma holders can get lateral-entry B.Tech seats through GGSIPU (IPU LEET) and DTU / NSUT, along with several IPU-affiliated colleges. Seats and cut-offs change every year, so check the current college list and previous-year cut-offs before filling your counselling choices.",
    },
    {
        q: "Which colleges accept lateral entry in Uttar Pradesh (AKTU / UP LEET)?",
        a: "In UP, lateral-entry B.Tech admission is handled by AKTU (Dr. A.P.J. Abdul Kalam Technical University) through UPTAC counselling, covering hundreds of affiliated colleges across the state. The college you get depends on your rank and category in the UP lateral-entry process.",
    },
    {
        q: "Which colleges accept lateral entry in Bihar?",
        a: "In Bihar, lateral-entry admission is conducted by the BCECE board (BCECE-LE) into government and private engineering colleges such as MIT Muzaffarpur, BCE Bhagalpur and others. Seats are allotted by rank through the state counselling process.",
    },
    {
        q: "Which colleges accept lateral entry in Haryana?",
        a: "In Haryana, HSTES handles lateral-entry B.Tech admission into state government and private colleges. The colleges you can reach depend on your rank and category in the Haryana counselling, so aim for a strong score and fill your choices carefully.",
    },
    {
        q: "Which is the best coaching for LEET / lateral entry?",
        a: "The best LEET preparation isn't expensive offline coaching, it's focused practice on what the exam actually asks. OneLeet is an online LEET coaching platform built for diploma students: real previous-year papers, exam-pattern mock tests, unlimited AI practice, subject notes, a day-by-day study plan and mentors who have cracked LEET. Many batches also carry a Success Promise, so you prepare with real accountability. Start free and upgrade only if it works for you.",
    },
    {
        q: "Is there online coaching for LEET?",
        a: "Yes. OneLeet is a fully online LEET coaching and preparation platform, so you can prepare from anywhere, around your diploma classes or a job. It replaces costly classroom coaching with real past papers, timed mock tests, AI-generated practice and a plan tied to your exam date.",
    },
    {
        q: "Does OneLeet guarantee success in LEET?",
        a: "No honest platform can guarantee a rank, since it depends on your effort and the competition. What OneLeet offers is a proven preparation system plus a Success Promise on eligible batches, a money-back commitment if you follow the plan and still don't get admission (terms vary by exam). That's real accountability, not an empty guarantee.",
    },
    {
        q: "What is the LEET exam pattern and syllabus?",
        a: "LEET is usually an objective (MCQ) paper covering Engineering Mathematics, Physics, Chemistry and core engineering subjects, with some states adding aptitude or English. Mathematics typically carries the most weight. Exact sections, marks and negative marking vary by state, so prepare from your state's official syllabus and rehearse with full mock tests.",
    },
    {
        q: "Is there negative marking in LEET?",
        a: "It depends on the state. Some LEET / lateral-entry papers apply negative marking and some don't, so check your state's official notification and plan your guessing strategy accordingly. Practising timed mock tests helps you build the right attempt strategy either way.",
    },
    {
        q: "How many years does B.Tech take through lateral entry?",
        a: "Three years. You enter directly in the second year (third semester), so you save one full year compared with starting a B.Tech from the first year. The degree you receive is a complete B.Tech / B.E.",
    },
    {
        q: "Is a lateral-entry B.Tech degree the same as a regular one?",
        a: "Yes. You graduate with the same B.Tech / B.E. degree as students who joined in the first year, with no mention of lateral entry on the final degree. You are equally eligible for campus placements, GATE, PSU jobs and higher studies like M.Tech.",
    },
    {
        q: "How do I prepare for LEET without coaching?",
        a: "Start by attempting one real previous-year paper to see the standard and your gaps. Then clear Mathematics first (highest weight), followed by Physics and Chemistry, practising each topic as you go, and take a timed mock test every week. A structured self-study plan with past papers, mocks and AI practice, all free on OneLeet, is enough for most students.",
    },
    {
        q: "Where can I find LEET previous year question papers?",
        a: "You can practise real LEET / lateral-entry previous-year papers free on OneLeet, with instant scoring and explanations. Past papers are the highest-value resource because they show exactly what the exam asks, so you don't waste time on topics that rarely appear.",
    },
    {
        q: "What percentage is needed in diploma for lateral entry?",
        a: "Most states ask for roughly 45 to 50 percent aggregate in your diploma, usually relaxed by about 5 percent for reserved categories. The exact cut-off is set by each state, so confirm it in your state's official notification before applying.",
    },
    {
        q: "Can B.Sc graduates apply for lateral entry?",
        a: "In several states, yes. B.Sc graduates with Mathematics as a subject can take lateral entry into the second year of B.Tech, though the eligible branches and number of seats may differ from the diploma route. Check your state's rules to be sure.",
    },
    {
        q: "Is lateral entry good for placements?",
        a: "Yes. Placements depend on your college, branch and skills, not on how you were admitted, and lateral-entry students sit for the same campus placements as everyone else. Many diploma holders bring a hands-on, practical edge that helps in interviews and projects.",
    },
    {
        q: "LEET or JEE, which is better after a diploma?",
        a: "For most diploma holders, lateral entry (LEET) is the smarter route: you reach the second year of B.Tech directly and finish in three years, using the engineering base your diploma already built. JEE means restarting from the first year and four more years. LEET is faster, usually cheaper, and plays to your strengths.",
    },
];

// FAQPage schema (Schema.org) built from the same source, so the structured
// data always matches the visible questions.
export function faqJsonLd(items = LEET_FAQ) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };
}
