const Mentor = require("../models/mentorModel");
const { FOUNDING_MENTORS } = require("./mentorSeedData");

// The founding mentors, seeded once so the Mentors page is populated out of the
// box (full journeys included). After seeding they're ordinary records an admin
// can manage. We only seed when the collection is completely empty, so removing
// a seeded mentor doesn't make it reappear on the next boot. (Databases seeded
// before journeys existed are upgraded by seedMentorJourneys.js instead.)
const SEED_MENTORS = FOUNDING_MENTORS;

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
