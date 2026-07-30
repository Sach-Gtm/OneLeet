const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

const SEED_KEY = "analogy-quick-shot-v1";

// 10 original analogy MCQs (moderate difficulty), covering the standard
// relationship types — home/habitat, service, need→remedy, tool→use,
// absence-of-sense, instrument→measure, antonyms, young-of-animal, number
// square, and creator→creation. Written fresh (not copied from any site).
const ANALOGY_QUESTIONS = [
    { text: "Bee : Hive :: Bird : ?", options: ["Sky", "Nest", "Tree", "Egg"], correctIndex: 1, explanation: "A hive is a bee's home, just as a nest is a bird's home." },
    { text: "Doctor : Patient :: Lawyer : ?", options: ["Court", "Judge", "Client", "Law"], correctIndex: 2, explanation: "A doctor serves a patient; a lawyer serves a client." },
    { text: "Hunger : Food :: Thirst : ?", options: ["Milk", "Water", "Bottle", "Cup"], correctIndex: 1, explanation: "Food relieves hunger; water relieves thirst." },
    { text: "Pen : Write :: Knife : ?", options: ["Sharp", "Cut", "Blade", "Kitchen"], correctIndex: 1, explanation: "A pen is used to write; a knife is used to cut." },
    { text: "Light : Blind :: Sound : ?", options: ["Loud", "Silence", "Deaf", "Ear"], correctIndex: 2, explanation: "One who cannot perceive light is blind; one who cannot perceive sound is deaf." },
    { text: "Thermometer : Temperature :: Barometer : ?", options: ["Pressure", "Humidity", "Rain", "Altitude"], correctIndex: 0, explanation: "A thermometer measures temperature; a barometer measures atmospheric pressure." },
    { text: "Victory : Defeat :: Ascent : ?", options: ["Climb", "Descent", "Height", "Peak"], correctIndex: 1, explanation: "Antonyms: victory–defeat, and ascent–descent." },
    { text: "Cow : Calf :: Horse : ?", options: ["Pony", "Foal", "Mare", "Stallion"], correctIndex: 1, explanation: "The young of a cow is a calf; the young of a horse is a foal." },
    { text: "7 : 49 :: 11 : ?", options: ["77", "121", "111", "132"], correctIndex: 1, explanation: "Each number is squared: 7² = 49 and 11² = 121." },
    { text: "Author : Novel :: Composer : ?", options: ["Piano", "Symphony", "Orchestra", "Stage"], correctIndex: 1, explanation: "An author creates a novel; a composer creates a symphony." },
];

// Publish a ready-made "Analogy — Quick Shot" warm-up test (10 questions) once,
// so students have something to try immediately. It's an ordinary test staff can
// edit/delete in the Content Studio; seeded only once (SeedFlag).
async function ensureAnalogyTestSeeded() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;

        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[analogy-test] no user to attribute yet; will publish on a later boot");
            return;
        }

        const docs = await Question.insertMany(
            ANALOGY_QUESTIONS.map((q) => ({
                ...q,
                subject: "Reasoning",
                topic: "Analogy",
                difficulty: "moderate",
                marks: 1,
                createdBy: owner._id,
            }))
        );

        await Test.create({
            title: "Reasoning: Analogy — Quick Shot",
            description: "A 10-question warm-up on verbal & non-verbal analogies. Answers reveal as you go.",
            subject: "Reasoning",
            category: "topic-wise",
            format: "quick-shot",
            mode: "practice", // warm-up: reveal the answer as they go
            durationMinutes: 10,
            targets: [], // reasoning is common to every LEET — show to all
            questions: docs.map((d) => d._id),
            totalMarks: docs.length,
            status: "published",
            isPublished: true,
            createdBy: owner._id,
        });
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[analogy-test] published the Analogy ${TEST_FORMATS["quick-shot"].label} (${docs.length} Q)`);
    } catch (e) {
        console.warn("[analogy-test] seed skipped:", e.message);
    }
}

module.exports = { ANALOGY_QUESTIONS, ensureAnalogyTestSeeded };
