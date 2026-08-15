const SeedFlag = require("../models/seedFlagModel");
const Review = require("../models/reviewModel");
const User = require("../models/userModel");

// One-time seeds for real, founder-supplied student success stories on the
// Success Wall. Each story is attached to the student's already-uploaded photo
// record when one exists (matched by name), so the story shows their real photo;
// otherwise a record is created (initials fallback).
//
// Each story carries its OWN seed flag, so adding a new story later never
// re-touches or resurrects an earlier one, and a story stays gone once staff
// delete it. Keshav reuses the original "success-stories-v1" flag as his guard,
// which means this refactor leaves his live record exactly as it is.

// Each story's first line doubles as the page's meta description (see
// CaseStory.jsx), so it leads with the hook + keywords.

const keshavStory = [
    "Just weeks before the IPU LEET exam, Keshav Kumar Jha thought his B.Tech dream was over — family responsibilities had kept him away from his books, and time had almost run out.",
    "Keshav had finished his diploma with real ability, but at home, life came first. Money was tight, responsibilities piled up, and studying quietly slipped down the list. With barely a month left before the Lateral Entry Entrance Test, most people would have told him to simply try again next year.",
    "That's when he reached out to OneLeet. Sachin didn't hand him a syllabus and disappear — he stood by Keshav like an elder brother. He listened first, steadied his nerves, and then built a brutally focused 30-day plan around the little time Keshav actually had.",
    "There were no 14-hour days. There were the right hours — high-yield topics first, real past papers, ranked mocks to fix his timing, and a daily check-in so Keshav never felt alone in it. On the hardest days, the message was simple: keep going, I've got you.",
    "Thirty days later, Keshav walked out of the IPU LEET exam and secured All-India Rank 65 — more than enough for the seat he'd quietly dreamt of: Computer Science at Maharaja Agrasen Institute of Technology (MAIT).",
    "Today Keshav is a B.Tech CSE student at MAIT — his dream college and his dream branch. His story is proof of something we believe deeply at OneLeet: a diploma student with the right guidance and an honest plan can beat circumstances that look impossible, even with just 30 days on the clock.",
    "If you're a diploma student staring at a short runway to LEET, let Keshav's journey be your reminder — it isn't too late. The right path, and someone in your corner, can still take you all the way to the top.",
].join("\n\n");

const roshanStory = [
    "Roshan did everything right on the LEET exam — but a mix-up in the counselling process nearly left him without a college seat at all.",
    "A sincere diploma student, Roshan had put in the hard months and earned a score he could be proud of. Then the part nobody warns you about went wrong: in the rush and confusion of LEET counselling, his choices didn't play out the way they should have, and round after round, the allotment he deserved simply didn't come.",
    "That's where OneLeet stepped in — not with a one-time pep talk, but with daily, hands-on counselling support. We sat with him through every choice-filling decision, every document and every 'what do I do now' moment, so a good rank wouldn't go to waste on a process nobody had explained to him.",
    "When it came down to the on-campus spot round, the plan held. Roshan secured a Computer Science (CSE) seat at Maharaja Agrasen Institute of Technology (MAIT) — the outcome his effort had always deserved.",
    "Today Roshan is genuinely happy with where he landed. His story is a reminder that in lateral entry, the exam is only half the game — the counselling is the other half, and you shouldn't have to play it alone.",
].join("\n\n");

const kaifStory = [
    "Kaif secured Rank 280 in IPU LEET 2025 and still had no seat after three rounds of counselling — here's how he ended up with CSE at MAIT anyway.",
    "Kaif came to OneLeet with about two months left before the exam and used every day of it — full study guidance, real past papers and ranked mocks — and it showed in his Rank 280.",
    "But a good rank isn't a seat. Through three rounds of IPU counselling nothing came through, and his family was starting to lean toward settling for whatever was easy rather than holding out for what was right.",
    "The OneLeet team stepped in on both fronts. We mapped out the colleges genuinely within his reach — strong names like MAIT and MSIT — and we sat down with his family to walk them through why aiming a little higher was worth the wait.",
    "It paid off: Kaif secured a Computer Science (CSE) seat at Maharaja Agrasen Institute of Technology (MAIT). Sometimes the hardest part of lateral entry isn't the exam — it's holding your nerve through counselling and choosing the seat your rank has actually earned.",
].join("\n\n");

const rohitStory = [
    "Rohit's LEET rank was somewhere around 1000 — not a number most students expect to turn into a top-college seat. The right counselling changed that.",
    "On paper, a rank near 1000 sends most diploma students to whatever college is left over. But a rank only decides your options — how you play the counselling decides your outcome.",
    "With OneLeet guiding the direction — which rounds to hold for, which choices to lock, when to move — Rohit used his rank far better than the number alone suggested, and landed a seat at Maharaja Agrasen Institute of Technology (MAIT).",
    "He's enjoying his B.Tech life at MAIT today. His story is proof that the right counselling can stretch a modest rank a long way — often further than students dare to hope.",
].join("\n\n");

const adityaStory = [
    "Aditya Shahi had already paid full fees at GTBIT when a MAIT seat opened up — and OneLeet helped him switch without having to pay twice.",
    "With an All-India Rank around 250 in IPU LEET, Aditya had first taken admission at GTBIT and paid his fees in full. Then a better-fit seat at Maharaja Agrasen Institute of Technology (MAIT) came within reach.",
    "The catch was money and timing. His GTBIT refund would take about a month to come through, but MAIT wanted the full fee upfront — and paying both at once simply wasn't possible for his family right then.",
    "So the OneLeet team went to bat for him. We worked with MAIT's administration and vouched for Aditya so he could secure the seat by paying about 20% now and the balance within a month — with OneLeet standing as guarantor so a temporary cash crunch wouldn't cost him his admission.",
    "Aditya cleared the balance himself within 20 days. His story is one we're especially proud of: sometimes the barrier isn't your rank or your preparation — it's paperwork and money, and having a team willing to stand behind you when it counts.",
].join("\n\n");

const STORIES = [
    {
        // Reuses the original v1 flag, so Keshav is never re-touched or resurrected.
        flag: "success-stories-v1",
        match: /keshav/i,
        fields: {
            author: "Keshav Kumar Jha",
            exam: "IPU LEET",
            rank: "AIR 65",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "keshav-kumar-jha-ipu-leet-mait",
            caseTitle: "How Keshav cracked IPU LEET at AIR 65 in 30 days — from family setbacks to MAIT CSE",
            caseStory: keshavStory,
            published: true,
        },
        fallbackText: "OneLeet and Sachin bhaiya stood by me when I had almost given up. Forever grateful. 🙏",
    },
    {
        flag: "success-story-roshan-mait",
        match: /roshan/i,
        fields: {
            author: "Roshan",
            exam: "IPU LEET",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "roshan-leet-counselling-mait-cse",
            caseTitle: "From a counselling setback to CSE at MAIT — Roshan's LEET comeback in the spot round",
            caseStory: roshanStory,
            published: true,
        },
        fallbackText: "The exam was only half the battle — OneLeet walked me through the counselling every single day until I had my MAIT seat.",
    },
    {
        flag: "success-story-kaif-mait",
        match: /kaif/i,
        fields: {
            author: "Kaif",
            exam: "IPU LEET",
            rank: "Rank 280",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "kaif-ipu-leet-mait-cse",
            caseTitle: "Rank 280 and still no seat — how Kaif landed CSE at MAIT with the right counselling",
            caseStory: kaifStory,
            published: true,
        },
        fallbackText: "Three rounds and no seat, and OneLeet still didn't give up on me — they got my family on board and I ended up with CSE at MAIT.",
    },
    {
        flag: "success-story-rohit-mait",
        match: /rohit/i,
        fields: {
            author: "Rohit",
            exam: "IPU LEET",
            rank: "Rank ~1000",
            college: "MAIT",
            isCase: true,
            slug: "rohit-leet-counselling-mait",
            caseTitle: "How the right counselling took Rohit from a rank near 1000 to a seat at MAIT",
            caseStory: rohitStory,
            published: true,
        },
        fallbackText: "My rank wasn't huge, but the right counselling put me in MAIT. Couldn't be happier here.",
    },
    {
        flag: "success-story-aditya-shahi-mait",
        match: /aditya\s*shahi/i,
        fields: {
            author: "Aditya Shahi",
            exam: "IPU LEET",
            rank: "AIR 250",
            college: "MAIT",
            isCase: true,
            slug: "aditya-shahi-ipu-leet-mait",
            caseTitle: "AIR 250, GTBIT to MAIT — how OneLeet helped Aditya switch colleges and clear a fee crunch",
            caseStory: adityaStory,
            published: true,
        },
        fallbackText: "I'd already paid GTBIT and thought MAIT was impossible. OneLeet made the switch happen and stood by me on the fees.",
    },
];

async function ensureSuccessStoriesSeeded() {
    try {
        let owner = null; // resolved lazily, only if we need to create a record
        for (const s of STORIES) {
            if (await SeedFlag.exists({ key: s.flag })) continue;

            const existing = await Review.findOne({ author: s.match });
            if (existing) {
                Object.assign(existing, s.fields); // keep _id, image, createdBy
                await existing.save();
            } else {
                if (!owner) {
                    owner =
                        (await User.findOne({ role: "superadmin" }).select("_id")) ||
                        (await User.findOne({ role: "admin" }).select("_id"));
                }
                if (!owner) {
                    console.warn("[success-stories] no admin to own the seed yet; will retry next boot");
                    continue; // leave the flag unset so it retries once an admin exists
                }
                await Review.create({ type: "text", text: s.fallbackText, ...s.fields, createdBy: owner._id });
            }

            await SeedFlag.create({ key: s.flag });
        }
        console.log("[success-stories] success-story seeds up to date");
    } catch (e) {
        console.warn("[success-stories] skipped:", e.message);
    }
}

module.exports = { ensureSuccessStoriesSeeded, STORIES };
