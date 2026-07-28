const Mentor = require("../models/mentorModel");

// The founding mentors, seeded once so the Mentors page is populated out of the
// box. After seeding they're ordinary records an admin can manage (add more /
// remove). We only seed when the collection is completely empty, so removing a
// seeded mentor doesn't make it reappear on the next boot.
const SEED_MENTORS = [
    { name: "Sachin Gautam", handle: "@sachingautam", exam: "IPU LEET 2025", order: 0 },
    { name: "Ayush", exam: "IPU LEET 2025", order: 1 },
    { name: "Parth Singh Shekhawat", exam: "IPU LEET 2024", order: 2 },
];

async function ensureMentorsSeeded() {
    try {
        const count = await Mentor.estimatedDocumentCount();
        if (count > 0) return;
        await Mentor.insertMany(SEED_MENTORS);
        console.log(`[mentors] seeded ${SEED_MENTORS.length} founding mentors`);
    } catch (e) {
        console.warn("[mentors] seed skipped:", e.message);
    }
}

module.exports = { SEED_MENTORS, ensureMentorsSeeded };
