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
    "Just weeks before the IPU LEET exam, Keshav Kumar Jha thought his B.Tech dream was over, family responsibilities had kept him away from his books, and time had almost run out.",
    "Keshav had finished his diploma with real ability, but at home, life came first. Money was tight, responsibilities piled up, and studying quietly slipped down the list. With barely a month left before the Lateral Entry Entrance Test, most people would have told him to simply try again next year.",
    "That's when he reached out to OneLeet. Sachin didn't hand him a syllabus and disappear, he stood by Keshav like an elder brother. He listened first, steadied his nerves, and then built a brutally focused 30-day plan around the little time Keshav actually had.",
    "There were no 14-hour days. There were the right hours, high-yield topics first, real past papers, ranked mocks to fix his timing, and a daily check-in so Keshav never felt alone in it. On the hardest days, the message was simple: keep going, I've got you.",
    "Thirty days later, Keshav walked out of the IPU LEET exam and secured All-India Rank 63, more than enough for the seat he'd quietly dreamt of: Computer Science at Maharaja Agrasen Institute of Technology (MAIT).",
    "Today Keshav is a B.Tech CSE student at MAIT, his dream college and his dream branch. His story is proof of something we believe deeply at OneLeet: a diploma student with the right guidance and an honest plan can beat circumstances that look impossible, even with just 30 days on the clock.",
    "If you're a diploma student staring at a short runway to LEET, let Keshav's journey be your reminder, it isn't too late. The right path, and someone in your corner, can still take you all the way to the top.",
].join("\n\n");

const roshanStory = [
    "Roshan did everything right on the LEET exam, but a mix-up in the counselling process nearly left him without a college seat at all.",
    "A sincere diploma student, Roshan had put in the hard months and earned a score he could be proud of. Then the part nobody warns you about went wrong: in the rush and confusion of LEET counselling, his choices didn't play out the way they should have, and round after round, the allotment he deserved simply didn't come.",
    "That's where OneLeet stepped in, not with a one-time pep talk, but with daily, hands-on counselling support. We sat with him through every choice-filling decision, every document and every 'what do I do now' moment, so a good rank wouldn't go to waste on a process nobody had explained to him.",
    "When it came down to the on-campus spot round, the plan held. Roshan secured a Computer Science (CSE) seat at Maharaja Agrasen Institute of Technology (MAIT), the outcome his effort had always deserved.",
    "Today Roshan is genuinely happy with where he landed. His story is a reminder that in lateral entry, the exam is only half the game, the counselling is the other half, and you shouldn't have to play it alone.",
].join("\n\n");

const kaifStory = [
    "Kaif scored Rank 280 in IPU LEET 2025, but the seat counselling first handed him was at USAR, far from home and nowhere near his first choice of MAIT.",
    "Kaif had come to OneLeet with about two months left before the exam and used every day of it, full study guidance, real past papers and ranked mocks, and it showed in his Rank 280.",
    "When the allotment came, though, his seat was at USAR, well down his own list of preferences and a long, tiring commute from home. It wasn't where he wanted to spend the next three years, and he knew it the moment he saw it.",
    "His family saw it differently. To them an admission was an admission, 'you've got a seat, just stay with it', and they were wary of him shuffling between colleges chasing something better. The pressure to simply settle was real, even though Kaif wasn't happy.",
    "That's where the OneLeet team stepped in, not just for Kaif, but for his whole family. We sat everyone down, explained honestly which upgrade was genuinely within reach, and walked his parents through why moving up was worth one more step rather than settling for a seat he'd regret.",
    "With everyone finally on the same page, Kaif moved up to a Computer Science (CSE) seat at Maharaja Agrasen Institute of Technology (MAIT), his first choice all along. Sometimes the hardest part of lateral entry isn't your rank; it's the pressure to settle, and having someone guide your family through the decision alongside you.",
].join("\n\n");

const rohitStory = [
    "Rohit scored Rank 283 in IPU LEET, a genuinely strong result, but a good rank still has to be turned into the right seat, and that comes down to counselling.",
    "A solid score opens doors, yet plenty of capable students still end up in the wrong college simply because they misplay the choice-filling, holding the wrong rounds, locking the wrong options, or hesitating when a better seat is one step away.",
    "That's where OneLeet came in. We guided Rohit's counselling end to end, which rounds to hold for, which choices to lock and when to move, so his Rank 283 landed him exactly where it should: a seat at Maharaja Agrasen Institute of Technology (MAIT).",
    "He's enjoying his B.Tech life at MAIT today. His story is a reminder that a strong rank is only half the job, the right counselling is what turns it into the college you actually want.",
].join("\n\n");

const adityaStory = [
    "Aditya Shahi had already paid full fees at GTBIT when a MAIT seat opened up, and OneLeet helped him switch without having to pay twice.",
    "With an All-India Rank around 250 in IPU LEET, Aditya had first taken admission at GTBIT and paid his fees in full. Then a better-fit seat at Maharaja Agrasen Institute of Technology (MAIT) came within reach.",
    "The catch was money and timing. His GTBIT refund would take about a month to come through, but MAIT wanted the full fee upfront, and paying both at once simply wasn't possible for his family right then.",
    "So the OneLeet team went to bat for him. We worked with MAIT's administration and vouched for Aditya so he could secure the seat by paying about 20% now and the balance within a month, with OneLeet standing as guarantor so a temporary cash crunch wouldn't cost him his admission.",
    "Aditya cleared the balance himself within 20 days. His story is one we're especially proud of: sometimes the barrier isn't your rank or your preparation, it's paperwork and money, and having a team willing to stand behind you when it counts.",
].join("\n\n");

const STORIES = [
    {
        // -v2: rank corrected to AIR 63 (was 65 — that was actually Krish's).
        flag: "success-story-keshav-mait-v2",
        match: /keshav/i,
        fields: {
            author: "Keshav Kumar Jha",
            exam: "IPU LEET",
            rank: "AIR 63",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "keshav-kumar-jha-ipu-leet-mait",
            caseTitle: "How Keshav cracked IPU LEET at AIR 63 in 30 days, from family setbacks to MAIT CSE",
            caseStory: keshavStory,
            published: true,
        },
        fallbackText: "OneLeet and Sachin bhaiya stood by me when I had almost given up. Forever grateful. 🙏",
    },
    {
        // Bumped to -v2 to refresh the short quote on already-seeded records.
        flag: "success-story-roshan-mait-v2",
        match: /roshan/i,
        fields: {
            author: "Roshan",
            text:
                "I had done the hardest part, the months of studying, the exam itself, and I still nearly ended up with nothing, all because the counselling process tripped me up at the worst possible moment. What saved my whole year was that OneLeet stayed right beside me through every round, every form and every confusing step until it was finally sorted out. When the on-campus spot round came, I walked away with CSE at MAIT. If you're preparing, take the counselling every bit as seriously as the paper, and don't try to figure it out alone.",
            exam: "IPU LEET",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "roshan-leet-counselling-mait-cse",
            caseTitle: "From a counselling setback to CSE at MAIT, Roshan's LEET comeback in the spot round",
            caseStory: roshanStory,
            published: true,
        },
    },
    {
        // -v3: story corrected (a far USAR seat + family pressure to settle,
        // not "no seat"); OneLeet guided him and his family up to MAIT CSE.
        flag: "success-story-kaif-mait-v3",
        match: /kaif/i,
        fields: {
            author: "Kaif",
            text:
                "When counselling gave me a seat at USAR, far from home and nowhere near my first choice, my family just wanted me to stay put and stop changing colleges. I wasn't happy, but the pressure to settle was hard to argue with. The OneLeet team sat down with all of us, heard everyone out, and patiently guided my family through why moving up was worth it. That's how I ended up with CSE at MAIT, the college I actually wanted. I'm so glad we didn't just settle.",
            exam: "IPU LEET",
            rank: "Rank 280",
            college: "MAIT",
            branch: "CSE",
            isCase: true,
            slug: "kaif-ipu-leet-mait-cse",
            caseTitle: "Rank 280 and a seat he didn't want, how Kaif moved from USAR to CSE at MAIT",
            caseStory: kaifStory,
            published: true,
        },
    },
    {
        // -v3: rank corrected to 283 (was ~1000) with the story reframed to match.
        flag: "success-story-rohit-mait-v3",
        match: /rohit/i,
        fields: {
            author: "Rohit",
            text:
                "My Rank 283 in LEET was a good score, but I still could have ended up in the wrong college if I'd misplayed the counselling. The OneLeet team guided every choice, which rounds to hold, which options to lock, and that's what turned my rank into a seat at MAIT. I'm really happy here. A rank gets you close; the right counselling gets you in.",
            exam: "IPU LEET",
            rank: "Rank 283",
            college: "MAIT",
            isCase: true,
            slug: "rohit-leet-counselling-mait",
            caseTitle: "How the right counselling turned Rohit's Rank 283 into a seat at MAIT",
            caseStory: rohitStory,
            published: true,
        },
    },
    {
        flag: "success-story-aditya-shahi-mait-v2",
        match: /aditya\s*shahi/i,
        fields: {
            author: "Aditya Shahi",
            text:
                "I had already paid my full fees at GTBIT when the MAIT seat opened up, and I honestly thought it was impossible, my refund would take a month to come and MAIT wanted the entire fee upfront. The OneLeet team went and spoke to the college on my behalf so I could pay in parts and not lose the seat, and they stood behind me the whole way through. I cleared the rest myself within twenty days. They didn't just guide my studies, they genuinely fought for my admission when it mattered most.",
            exam: "IPU LEET",
            rank: "AIR 250",
            college: "MAIT",
            isCase: true,
            slug: "aditya-shahi-ipu-leet-mait",
            caseTitle: "AIR 250, GTBIT to MAIT, how OneLeet helped Aditya switch colleges and clear a fee crunch",
            caseStory: adityaStory,
            published: true,
        },
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
