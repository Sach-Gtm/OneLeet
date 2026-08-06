const User = require("../models/userModel");
const Course = require("../models/courseModel");
const Enrollment = require("../models/enrollmentModel");
const SeedFlag = require("../models/seedFlagModel");

// One-time cutover to the enrollment model. A student's `exams` used to be a
// self-chosen preference (including the "all" = All-LEET sentinel); access now
// derives from Course enrollments. This backfill migrates existing students
// WITHOUT disrupting their access:
//
//   • A student on ["all"] (All LEET) is reset to zero enrollments (exams: [])
//     so they land on the "pick your batch" nudge — "All LEET" is going away.
//   • Every other student keeps their `exams` AND is auto-enrolled into each
//     published Course whose exam-code they already had, so their batch shows up
//     under "my enrollments". A code with no matching course yet is left in
//     `exams` so they keep seeing that exam's content; they can formally enroll
//     once a batch for it is published.
//
// Idempotent: guarded by a SeedFlag, and each per-user op is itself idempotent
// (enrollment upsert; setting exams: []), so a re-run can't duplicate anything.
async function ensureEnrollmentBackfill() {
    try {
        const key = "enrollment-backfill-v1";
        if (await SeedFlag.exists({ key })) return;

        // exam-code → published course id, so we enroll into the right batch.
        const courses = await Course.find({ published: true }).select("_id examCode").lean();
        const courseByCode = new Map(courses.map((c) => [c.examCode, c._id]));

        const students = await User.find({ role: "student", exams: { $exists: true, $ne: [] } })
            .select("_id exams")
            .lean();

        let reset = 0;
        let enrolled = 0;
        for (const s of students) {
            const codes = Array.isArray(s.exams) ? s.exams : [];
            if (codes.includes("all")) {
                await User.updateOne({ _id: s._id }, { $set: { exams: [] } });
                reset++;
                continue;
            }
            for (const code of codes) {
                const courseId = courseByCode.get(code);
                if (!courseId) continue; // no batch for this exam yet — keep the cache entry
                await Enrollment.findOneAndUpdate(
                    { student: s._id, course: courseId },
                    { $set: { examCode: code, status: "active" } },
                    { upsert: true, setDefaultsOnInsert: true }
                );
                enrolled++;
            }
        }
        await SeedFlag.create({ key });
        console.log(`[enrollment-backfill] reset ${reset} All-LEET student(s); backfilled ${enrolled} enrollment(s)`);
    } catch (e) {
        console.warn("[enrollment-backfill] skipped:", e.message);
    }
}

module.exports = { ensureEnrollmentBackfill };
