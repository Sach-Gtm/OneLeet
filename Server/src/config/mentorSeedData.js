// The founding mentors' journeys, in OneLeet's own voice. Single source of
// truth for both the fresh-DB seed (seedMentors.js) and the one-time migration
// that upgrades already-seeded records (seedMentorJourneys.js). Matched by
// `slug`. These are real, named people the founder adds on purpose (the Mentors
// exception to the no-names rule). Copy is aspirational — it never promises a
// guaranteed rank, seat or job.

const FOUNDING_MENTORS = [
    {
        slug: "sachin-gautam",
        name: "Sachin Gautam",
        role: "Founder & Head Mentor",
        exam: "IPU LEET — AIR 54",
        handle: "@sachingautam",
        order: 0,
        tagline: "AIR 54 with zero coaching — now building the path he wishes he'd had.",
        description:
            "From a DSEU Dwarka diploma to AIR 54 in IPU LEET — no coaching, just a sharp, selective strategy. Turned down a Samsung R&D offer to chase a full-time B.Tech, and has guided 100+ students since.",
        highlights: [
            "AIR 54 in IPU LEET — without a single coaching class",
            "Turned down a Software Testing Engineer offer from Samsung R&D",
            "Guided 100+ students through counselling — completely free",
            "3× college hackathon winner",
            "Building 2–3 startups, and still going",
        ],
        stats: [
            { value: "54", label: "IPU LEET All-India Rank" },
            { value: "100+", label: "Students guided free" },
            { value: "0", label: "Coaching classes taken" },
            { value: "3×", label: "Hackathons won" },
        ],
        story: [
            "I did my diploma at DSEU's Dwarka campus and spent a year working after it. Then came the offer I was “supposed” to take — Software Testing Engineer at Samsung R&D Institute. I turned it down.",
            "Not because it wasn't a good offer, but because I wanted what a regular B.Tech gives you: three years on a campus, the time to explore, and peers who push you higher. So I sat for LEET — and cleared it at All-India Rank 54, without a single coaching class. Not by studying everything, but by studying the right things, strategically.",
            "I had a seat at DTU too, but I chose GGSIPU for the branch that actually mattered to me. Sitting close to my diploma's administration and placement cell, I'd learned the LEET pattern inside-out — every section, every shortcut, every trap.",
            "So I started guiding juniors. 100+ of them, through counselling, documents and choices — for free — into colleges they'd only dreamt of. Along the way I won three hackathons and started building companies of my own.",
            "Here's what I believe: diploma students are underrated — often ahead of the 12th-then-JEE route, not behind it. Give a diploma student the right path, and the future isn't just bright, it gets brighter every year. That belief is why OneLeet exists — to be the guide I wish I'd had.",
        ].join("\n\n"),
        links: [{ label: "oneleet.in", url: "https://oneleet.in" }],
    },
    {
        slug: "parth-singh-shekhawat",
        name: "Parth Singh Shekhawat",
        role: "Mentor",
        exam: "IPU LEET 2024 — AIR 6",
        order: 1,
        tagline: "AIR 6 — mentored before OneLeet even had a website.",
        description:
            "Cracked IPU LEET at AIR 6 — guided by OneLeet before it was ever a company, back when it lived only on paper. Left a job for his regular B.Tech; now in his final year at MSIT.",
        highlights: [
            "AIR 6 in IPU LEET 2024",
            "Mentored pre-launch — when OneLeet existed only on paper",
            "Left a job to pursue a full-time B.Tech",
            "Final-year student at MSIT",
        ],
        stats: [
            { value: "6", label: "IPU LEET All-India Rank" },
            { value: "2024", label: "Year cleared" },
            { value: "MSIT", label: "Now studying at" },
        ],
        story: [
            "Parth scored All-India Rank 6 in IPU LEET 2024 — and here's the part we're proudest of: he got that guidance from OneLeet before OneLeet officially existed. No website, no app, no company — just a method on paper and a founder quietly building it.",
            "Like a lot of the students we work with, Parth had already stepped into a job. He left it to pursue a full-time regular B.Tech — betting on the longer, richer path. Today he's in his final year at MSIT.",
            "He's living proof that the right guidance beats the biggest coaching brand. You don't need a logo behind you — you need a plan that works.",
        ].join("\n\n"),
        links: [],
    },
    {
        slug: "ayush",
        name: "Ayush",
        role: "Mentor & Co-founder",
        exam: "IPU LEET — Rank 63",
        order: 2,
        tagline: "Rank 63 with no coaching — only the right guidance.",
        description:
            "Cleared IPU LEET at rank 63 without a single coaching class — just Sachin's guidance. Left a job after 3 months for a full-time B.Tech at Maharaja Agrasen, and co-founded two ventures.",
        highlights: [
            "Rank 63 in IPU LEET — no coaching, only guidance",
            "Left his job after 3 months for a full-time B.Tech",
            "B.Tech at Maharaja Agrasen Institute of Technology",
            "Co-founder of two ventures — oneleet.in & viboraonline.in",
        ],
        stats: [
            { value: "63", label: "IPU LEET Rank" },
            { value: "2", label: "Ventures co-founded" },
            { value: "0", label: "Coaching classes taken" },
        ],
        story: [
            "Ayush cleared IPU LEET at rank 63 — without a single coaching class. What he had instead was Sachin's guidance, and it was enough.",
            "He gave a job three months, then left it to go all-in on a full-time B.Tech at Maharaja Agrasen Institute of Technology. Since then he's become a builder in his own right — co-founder of two ventures, oneleet.in and viboraonline.in.",
            "Ayush is a reminder that the classroom is only part of the story. The right mentor — and the willingness to bet on yourself — is the rest.",
        ].join("\n\n"),
        links: [
            { label: "oneleet.in", url: "https://oneleet.in" },
            { label: "viboraonline.in", url: "https://viboraonline.in" },
        ],
    },
];

module.exports = { FOUNDING_MENTORS };
