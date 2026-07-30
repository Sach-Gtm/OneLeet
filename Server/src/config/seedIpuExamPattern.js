const ExamPattern = require("../models/examPatternModel");
const User = require("../models/userModel");

const DAY = 24 * 60 * 60 * 1000;
// Placeholder countdown target: ~275 days out from first boot. Admins edit this
// to the real date once IPU announces it (Content Studio → exam patterns).
const COUNTDOWN_DAYS = 275;

// Seed a minimal, published IPU LEET exam pattern carrying an exam DATE, so IPU
// LEET students get a live countdown ("N days to go") from day one. It's an
// ordinary record — admins flesh out the details and adjust the date whenever.
// Seeded only when no ipu-leet pattern exists yet, so edits/removals stick.
async function ensureIpuExamPatternSeeded() {
    try {
        const already = await ExamPattern.exists({ examCode: "ipu-leet" });
        if (already) return;

        const owner = await User.findOne({ role: { $in: ["superadmin", "admin"] } })
            .sort({ createdAt: 1 })
            .select("_id")
            .lean();
        if (!owner) {
            console.warn("[ipu-exam-pattern] no admin to attribute yet; will seed on a later boot");
            return;
        }

        await ExamPattern.create({
            examCode: "ipu-leet",
            examName: "IPU LEET (GGSIPU)",
            conductingBody: "GGSIPU",
            place: "Delhi NCR",
            examDate: new Date(Date.now() + COUNTDOWN_DAYS * DAY),
            published: true,
            createdBy: owner._id,
        });
        console.log(`[ipu-exam-pattern] seeded IPU LEET with a ~${COUNTDOWN_DAYS}-day countdown`);
    } catch (e) {
        console.warn("[ipu-exam-pattern] seed skipped:", e.message);
    }
}

module.exports = { ensureIpuExamPatternSeeded, COUNTDOWN_DAYS };
