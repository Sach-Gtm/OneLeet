const SeedFlag = require("../models/seedFlagModel");
const Review = require("../models/reviewModel");
const User = require("../models/userModel");

// One-time seed for real, founder-supplied student success stories on the
// Success Wall. Each is attached to the student's already-uploaded photo record
// when one exists (matched by name), so the story shows their real photo;
// otherwise a record is created (initials fallback). Guarded by a SeedFlag so it
// runs exactly once and never overwrites later admin edits or resurrects a
// staff-deleted story.
const KEY = "success-stories-v1";

// The first line doubles as the page's meta description (see CaseStory.jsx),
// so it leads with the hook + keywords.
const keshavStory = [
    "Just weeks before the IPU LEET exam, Keshav Kumar Jha thought his B.Tech dream was over — family responsibilities had kept him away from his books, and time had almost run out.",
    "Keshav had finished his diploma with real ability, but at home, life came first. Money was tight, responsibilities piled up, and studying quietly slipped down the list. With barely a month left before the Lateral Entry Entrance Test, most people would have told him to simply try again next year.",
    "That's when he reached out to OneLeet. Sachin didn't hand him a syllabus and disappear — he stood by Keshav like an elder brother. He listened first, steadied his nerves, and then built a brutally focused 30-day plan around the little time Keshav actually had.",
    "There were no 14-hour days. There were the right hours — high-yield topics first, real past papers, ranked mocks to fix his timing, and a daily check-in so Keshav never felt alone in it. On the hardest days, the message was simple: keep going, I've got you.",
    "Thirty days later, Keshav walked out of the IPU LEET exam and secured All-India Rank 65 — more than enough for the seat he'd quietly dreamt of: Computer Science at Maharaja Agrasen Institute of Technology (MAIT).",
    "Today Keshav is a B.Tech CSE student at MAIT — his dream college and his dream branch. His story is proof of something we believe deeply at OneLeet: a diploma student with the right guidance and an honest plan can beat circumstances that look impossible, even with just 30 days on the clock.",
    "If you're a diploma student staring at a short runway to LEET, let Keshav's journey be your reminder — it isn't too late. The right path, and someone in your corner, can still take you all the way to the top.",
].join("\n\n");

const STORIES = [
    {
        // Matches the founder's uploaded photo record by name.
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
        // Used only if no matching record exists (a fresh DB with no photo).
        fallbackText: "OneLeet and Sachin bhaiya stood by me when I had almost given up. Forever grateful. 🙏",
    },
];

async function ensureSuccessStoriesSeeded() {
    try {
        if (await SeedFlag.exists({ key: KEY })) return;

        let owner = null; // resolved lazily, only if we need to create a record
        for (const s of STORIES) {
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
                    console.warn("[success-stories] no admin to own the seed yet; skipping create");
                    continue;
                }
                await Review.create({ type: "text", text: s.fallbackText, ...s.fields, createdBy: owner._id });
            }
        }

        await SeedFlag.create({ key: KEY });
        console.log("[success-stories] seeded founder success stories");
    } catch (e) {
        console.warn("[success-stories] skipped:", e.message);
    }
}

module.exports = { ensureSuccessStoriesSeeded, STORIES };
