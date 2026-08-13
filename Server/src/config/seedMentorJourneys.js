const SeedFlag = require("../models/seedFlagModel");
const Mentor = require("../models/mentorModel");
const { FOUNDING_MENTORS } = require("./mentorSeedData");

// One-time upgrade: databases seeded before mentor "journeys" existed hold three
// bare founding-mentor records (name/exam/handle only). This fills in their full
// journeys — slug, role, tagline, story, highlights, stats, links — matched by
// name, and creates any that are missing so all three go live. A staff-uploaded
// photo and the published flag are preserved. Guarded by a SeedFlag so it runs
// exactly once and never re-writes later admin edits.
const KEY = "mentors-journeys-v1";

async function ensureMentorJourneysSeeded() {
    try {
        if (await SeedFlag.exists({ key: KEY })) return;

        for (const m of FOUNDING_MENTORS) {
            // Match the existing bare record by name (case-insensitive, exact).
            const existing = await Mentor.findOne({
                name: new RegExp(`^${m.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            });

            const fields = {
                slug: m.slug,
                name: m.name,
                role: m.role,
                exam: m.exam,
                tagline: m.tagline,
                description: m.description,
                story: m.story,
                highlights: m.highlights,
                stats: m.stats,
                links: m.links,
                handle: m.handle,
                order: m.order,
            };

            if (existing) {
                Object.assign(existing, fields); // keep _id, photo, published, createdBy
                await existing.save();
            } else {
                await Mentor.create({ ...fields, published: true });
            }
        }

        await SeedFlag.create({ key: KEY });
        console.log(`[mentors] upgraded ${FOUNDING_MENTORS.length} founding mentors with full journeys`);
    } catch (e) {
        console.warn("[mentor-journeys] skipped:", e.message);
    }
}

module.exports = { ensureMentorJourneysSeeded };
