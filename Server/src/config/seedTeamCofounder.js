const SeedFlag = require("../models/seedFlagModel");
const Mentor = require("../models/mentorModel");
const { FOUNDING_MENTORS } = require("./mentorSeedData");

// One-time: add co-founder Robin to teams that were seeded before he existed, and
// slot him second (right after the founder) by nudging the other two mentors'
// order down. Robin is matched by name so this never duplicates him, and it's
// guarded by a SeedFlag so it runs exactly once and never overwrites later admin
// edits. A staff-uploaded photo and the published flag on any existing record are
// preserved. (Fresh databases already get Robin from the base seed, in order.)
//
// v2: re-sync Robin's seeded fields so an already-live record picks up the
// corrected stat tile ("MBA" as the value, "IIM Rohtak" as the label — it was too
// wide the other way round). Still preserves any staff photo / published flag.
const KEY = "team-cofounder-robin-v2";

async function ensureTeamCofounderSeeded() {
    try {
        if (await SeedFlag.exists({ key: KEY })) return;

        const robin = FOUNDING_MENTORS.find((m) => m.slug === "robin");
        if (robin) {
            const existing = await Mentor.findOne({
                name: new RegExp(`^${robin.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            });
            const fields = {
                slug: robin.slug,
                name: robin.name,
                role: robin.role,
                exam: robin.exam,
                tagline: robin.tagline,
                description: robin.description,
                story: robin.story,
                highlights: robin.highlights,
                stats: robin.stats,
                links: robin.links,
                order: robin.order,
            };
            if (existing) {
                Object.assign(existing, fields); // keep _id, photo, published, createdBy
                await existing.save();
            } else {
                await Mentor.create({ ...fields, published: true });
            }
        }

        // Keep the team order tidy after inserting Robin at 1: founder (0),
        // Robin (1), then the two LEET mentors. Only their order field is touched.
        await Mentor.updateOne({ slug: "parth-singh-shekhawat" }, { $set: { order: 2 } });
        await Mentor.updateOne({ slug: "ayush" }, { $set: { order: 3 } });

        await SeedFlag.create({ key: KEY });
        console.log("[team] added co-founder Robin and reordered the team");
    } catch (e) {
        console.warn("[team-cofounder] skipped:", e.message);
    }
}

module.exports = { ensureTeamCofounderSeeded };
