const SeedFlag = require("../models/seedFlagModel");

// One-time, data-preserving migration: DTU and NSUT used to be two separate
// exams (dtu-leet, nsut-leet), but they share a single lateral-entry exam for
// counselling — so they're now one combined "DTU / NSUT Lateral Entry"
// (dtu-nsut-leet). This folds the two old codes into the new one everywhere:
//   • the exam catalog (Exam collection)
//   • students' chosen exams (User.exams)
//   • content targeting (Test / Note / Video / Syllabus `targets`)
//   • exam patterns keyed by examCode
// Guarded by a SeedFlag, so it runs exactly once and never resurrects the split.

const OLD = ["dtu-leet", "nsut-leet"];
const NEW = "dtu-nsut-leet";
const NEW_NAME = "DTU / NSUT Lateral Entry";
const KEY = "merge-dtu-nsut-v1";

async function ensureDtuNsutMerged() {
    try {
        if (await SeedFlag.exists({ key: KEY })) return;

        const Exam = require("../models/examModel");
        const User = require("../models/userModel");
        const Test = require("../models/testModel");
        const Note = require("../models/noteModel");
        const Video = require("../models/videoModel");
        const Syllabus = require("../models/syllabusModel");
        const ExamPattern = require("../models/examPatternModel");
        const { refreshExams } = require("./exams");

        // 1. Make sure the combined exam exists (inherit DTU's catalog position).
        const dtu = await Exam.findOne({ code: "dtu-leet" }).lean();
        await Exam.updateOne(
            { code: NEW },
            { $setOnInsert: { code: NEW, name: NEW_NAME, group: "Delhi NCR", order: dtu?.order ?? 1 } },
            { upsert: true }
        );

        // 2. Re-point any content targeted at either old code to the combined one
        //    (add the new code, then drop the old ones — $addToSet keeps it deduped).
        for (const Model of [Test, Note, Video, Syllabus]) {
            await Model.updateMany({ targets: { $in: OLD } }, { $addToSet: { targets: NEW } });
            await Model.updateMany({ targets: { $in: OLD } }, { $pull: { targets: { $in: OLD } } });
        }

        // 3. Re-point students who picked either old exam.
        await User.updateMany({ exams: { $in: OLD } }, { $addToSet: { exams: NEW } });
        await User.updateMany({ exams: { $in: OLD } }, { $pull: { exams: { $in: OLD } } });

        // 4. Re-point exam patterns keyed to an old code.
        await ExamPattern.updateMany({ examCode: { $in: OLD } }, { $set: { examCode: NEW } });

        // 5. Drop the standalone DTU + NSUT catalog entries and refresh the cache.
        await Exam.deleteMany({ code: { $in: OLD } });
        await refreshExams();

        await SeedFlag.create({ key: KEY });
        console.log("[merge-dtu-nsut] merged DTU + NSUT into a single DTU / NSUT exam");
    } catch (e) {
        console.warn("[merge-dtu-nsut] skipped:", e.message);
    }
}

module.exports = { OLD, NEW, NEW_NAME, ensureDtuNsutMerged };
