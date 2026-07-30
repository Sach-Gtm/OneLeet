const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Nine more "Quick Shot" reasoning warm-ups (10 questions each) — one per classic
// competitive-reasoning topic the founder listed. All questions are original
// (moderate difficulty), written fresh rather than copied from any site, and each
// test uses the same LOCKED Quick Shot format as the Analogy warm-up: practice
// mode (the answer reveals as you go), 10 minutes, shown to every LEET.
//
// Each topic is seeded once behind its own SeedFlag, so staff can freely edit or
// delete any of them in the Content Studio and it will never resurrect — and new
// topics can be added later without re-touching the ones already published.

const QUICK_SHOT = TEST_FORMATS["quick-shot"]; // { label, count: 10, ... }

const BANKS = [
    {
        slug: "classification",
        topic: "Classification",
        blurb: "Spot the item that doesn't belong to the group. Answers reveal as you go.",
        questions: [
            { text: "Which one does NOT belong with the others?", options: ["Rose", "Lotus", "Mango", "Marigold"], correctIndex: 2, explanation: "All are flowers except Mango, which is a fruit." },
            { text: "Which one does NOT belong with the others?", options: ["Bronze", "Copper", "Zinc", "Iron"], correctIndex: 0, explanation: "Bronze is an alloy; the rest are pure metals." },
            { text: "Which one does NOT belong with the others?", options: ["Square", "Circle", "Rectangle", "Triangle"], correctIndex: 1, explanation: "A circle has no straight sides; the others are polygons." },
            { text: "Which one does NOT belong with the others?", options: ["Cricket", "Hockey", "Football", "Chess"], correctIndex: 3, explanation: "Chess is an indoor board game; the rest are outdoor field sports." },
            { text: "Which one does NOT belong with the others?", options: ["Eye", "Elbow", "Ear", "Nose"], correctIndex: 1, explanation: "The elbow is a joint; the rest are sense organs." },
            { text: "Which one does NOT belong with the others?", options: ["Delhi", "Nepal", "Mumbai", "Chennai"], correctIndex: 1, explanation: "Nepal is a country; the rest are Indian cities." },
            { text: "Which one does NOT belong with the others?", options: ["Table", "Chair", "Bench", "Wood"], correctIndex: 3, explanation: "Wood is a material; the rest are furniture made from it." },
            { text: "Which one does NOT belong with the others?", options: ["January", "June", "March", "May"], correctIndex: 1, explanation: "June has 30 days; January, March and May each have 31." },
            { text: "Which one does NOT belong with the others?", options: ["Cobra", "Crocodile", "Krait", "Viper"], correctIndex: 1, explanation: "A crocodile is not a snake; the rest are snakes." },
            { text: "Which one does NOT belong with the others?", options: ["Mercury", "Venus", "Earth", "Sun"], correctIndex: 3, explanation: "The Sun is a star; the rest are planets." },
        ],
    },
    {
        slug: "odd-man-out",
        topic: "Odd Man Out",
        blurb: "Find the number that breaks the pattern the others share. Answers reveal as you go.",
        questions: [
            { text: "Find the odd one out.", options: ["11", "15", "13", "17"], correctIndex: 1, explanation: "15 = 3 × 5 is composite; the rest are prime numbers." },
            { text: "Find the odd one out.", options: ["8", "27", "64", "72"], correctIndex: 3, explanation: "8, 27 and 64 are perfect cubes; 72 is not." },
            { text: "Find the odd one out.", options: ["44", "16", "25", "36"], correctIndex: 0, explanation: "16, 25 and 36 are perfect squares; 44 is not." },
            { text: "Find the odd one out.", options: ["2", "4", "9", "6"], correctIndex: 2, explanation: "9 is odd; 2, 4 and 6 are even." },
            { text: "Find the odd one out.", options: ["121", "150", "144", "169"], correctIndex: 1, explanation: "121, 144 and 169 are perfect squares; 150 is not." },
            { text: "Find the odd one out.", options: ["15", "25", "35", "42"], correctIndex: 3, explanation: "15, 25 and 35 are multiples of 5; 42 is not." },
            { text: "Find the odd one out.", options: ["10", "23", "30", "40"], correctIndex: 1, explanation: "23 is not a multiple of 10; the rest are." },
            { text: "Find the odd one out.", options: ["49", "37", "53", "61"], correctIndex: 0, explanation: "49 = 7² is composite; the rest are prime numbers." },
            { text: "Find the odd one out.", options: ["81", "100", "120", "49"], correctIndex: 2, explanation: "81, 100 and 49 are perfect squares; 120 is not." },
            { text: "Find the odd one out.", options: ["1", "18", "8", "125"], correctIndex: 1, explanation: "1, 8 and 125 are perfect cubes; 18 is not." },
        ],
    },
    {
        slug: "verbal-classification",
        topic: "Verbal Classification",
        blurb: "Pick the word that belongs to a different class. Answers reveal as you go.",
        questions: [
            { text: "Choose the word that does NOT belong.", options: ["Apple", "Banana", "Potato", "Mango"], correctIndex: 2, explanation: "Potato is a vegetable; the rest are fruits." },
            { text: "Choose the word that does NOT belong.", options: ["Bank", "Rupee", "Dollar", "Euro"], correctIndex: 0, explanation: "A bank is an institution; the rest are currencies." },
            { text: "Choose the word that does NOT belong.", options: ["Lion", "Horse", "Tiger", "Leopard"], correctIndex: 1, explanation: "A horse is a herbivore; the rest are big cats." },
            { text: "Choose the word that does NOT belong.", options: ["Hindi", "English", "Marathi", "India"], correctIndex: 3, explanation: "India is a country; the rest are languages." },
            { text: "Choose the word that does NOT belong.", options: ["Doctor", "Hospital", "Engineer", "Teacher"], correctIndex: 1, explanation: "A hospital is a place; the rest are professions." },
            { text: "Choose the word that does NOT belong.", options: ["Guitar", "Flute", "Violin", "Song"], correctIndex: 3, explanation: "A song is not a musical instrument; the rest are." },
            { text: "Choose the word that does NOT belong.", options: ["Bright", "Red", "Green", "Blue"], correctIndex: 0, explanation: "'Bright' describes intensity, not a colour." },
            { text: "Choose the word that does NOT belong.", options: ["Triangle", "Pentagon", "Cube", "Hexagon"], correctIndex: 2, explanation: "A cube is a 3-D solid; the rest are 2-D shapes." },
            { text: "Choose the word that does NOT belong.", options: ["Carrot", "Radish", "Beetroot", "Cabbage"], correctIndex: 3, explanation: "Cabbage grows above ground; the rest are root vegetables." },
            { text: "Choose the word that does NOT belong.", options: ["Sparrow", "Bat", "Parrot", "Crow"], correctIndex: 1, explanation: "A bat is a mammal; the rest are birds." },
        ],
    },
    {
        slug: "series-completion",
        topic: "Series Completion",
        blurb: "Work out the rule and fill the missing number. Answers reveal as you go.",
        questions: [
            { text: "2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], correctIndex: 1, explanation: "Differences grow 4, 6, 8, 10, 12; 30 + 12 = 42." },
            { text: "3, 6, 12, 24, ?", options: ["36", "48", "54", "42"], correctIndex: 1, explanation: "Each term doubles; 24 × 2 = 48." },
            { text: "1, 4, 9, 16, 25, ?", options: ["30", "49", "36", "42"], correctIndex: 2, explanation: "Perfect squares 1²…5²; next is 6² = 36." },
            { text: "1, 1, 2, 3, 5, 8, ?", options: ["11", "13", "12", "15"], correctIndex: 1, explanation: "Fibonacci: each term is the sum of the two before it; 5 + 8 = 13." },
            { text: "5, 10, 20, 40, ?", options: ["80", "60", "70", "100"], correctIndex: 0, explanation: "Each term doubles; 40 × 2 = 80." },
            { text: "2, 5, 10, 17, 26, ?", options: ["35", "36", "37", "39"], correctIndex: 2, explanation: "Add successive odd numbers 3, 5, 7, 9, 11; 26 + 11 = 37." },
            { text: "100, 96, 88, 76, 60, ?", options: ["44", "40", "48", "36"], correctIndex: 1, explanation: "Amounts subtracted grow 4, 8, 12, 16, 20; 60 − 20 = 40." },
            { text: "7, 14, 28, 56, ?", options: ["112", "96", "102", "120"], correctIndex: 0, explanation: "Each term doubles; 56 × 2 = 112." },
            { text: "1, 8, 27, 64, ?", options: ["100", "121", "144", "125"], correctIndex: 3, explanation: "Perfect cubes 1³…4³; next is 5³ = 125." },
            { text: "3, 7, 15, 31, ?", options: ["47", "62", "63", "55"], correctIndex: 2, explanation: "Each term = previous × 2 + 1; 31 × 2 + 1 = 63." },
        ],
    },
    {
        slug: "continuous-pattern-series",
        topic: "Continuous Pattern Series",
        blurb: "A block of letters repeats — fill the gaps in order. Answers reveal as you go.",
        questions: [
            { text: "Fill the gaps in order:  a  b  _  c  a  _  c  c  _  b  c  _", options: ["abcc", "cbac", "bacc", "ccab"], correctIndex: 1, explanation: "The block 'abcc' repeats; the gaps in order are c, b, a, c." },
            { text: "Fill the gaps in order:  a  a  _  _  a  b  a  _  b", options: ["aba", "baa", "aab", "bba"], correctIndex: 1, explanation: "The block 'aab' repeats; the gaps in order are b, a, a." },
            { text: "Fill the gaps in order:  _  b  b  _  b  b  _  b  b", options: ["bab", "aaa", "bba", "abb"], correctIndex: 1, explanation: "The block 'abb' repeats; each gap starts a block, so all are 'a'." },
            { text: "Fill the gaps in order:  a  _  c  d  a  b  _  d  a  b  c  _", options: ["bcd", "bbd", "bcc", "cbd"], correctIndex: 0, explanation: "The block 'abcd' repeats every four letters; the gaps are b, c and d." },
            { text: "Fill the gaps in order:  _  y  x  _  _  y  x  _", options: ["yxyx", "xyxy", "xxyy", "xyyx"], correctIndex: 1, explanation: "'xy' alternates; the gaps in order are x, y, x, y." },
            { text: "Fill the gaps in order:  _  n  o  m  _  o  m  n  _", options: ["mno", "nom", "omn", "mnn"], correctIndex: 0, explanation: "The block 'mno' repeats; the gaps in order are m, n and o." },
            { text: "Fill the gaps in order:  _  a  _  b  a  _  b  _  a  a  b  b", options: ["abab", "aabb", "baba", "abba"], correctIndex: 0, explanation: "The block 'aabb' repeats; the four gaps give a, b, a, b." },
            { text: "Fill the gaps in order:  s  t  _  s  _  u  _  t  u", options: ["stu", "uts", "tus", "ust"], correctIndex: 1, explanation: "The block 'stu' repeats; the gaps in order are u, t, s." },
            { text: "Fill the gaps in order:  a  b  c  _  b  c  a  _  c  a  b  _", options: ["aaa", "abc", "bca", "cab"], correctIndex: 1, explanation: "The block 'abc' repeats; positions 4, 8 and 12 give a, b and c." },
            { text: "Fill the gaps in order:  p  _  r  p  _  r  p  _  r", options: ["qqq", "pqr", "rpq", "qrp"], correctIndex: 0, explanation: "The block 'pqr' repeats; positions 2, 5 and 8 are each 'q'." },
        ],
    },
    {
        slug: "letter-and-symbol-series",
        topic: "Letter & Symbol Series",
        blurb: "Find the next term in the letter/number series. Answers reveal as you go.",
        questions: [
            { text: "A, C, E, G, ?", options: ["H", "J", "I", "K"], correctIndex: 2, explanation: "Skip one letter each time (A, C, E, G…); next is I." },
            { text: "B, D, F, H, ?", options: ["I", "K", "J", "L"], correctIndex: 2, explanation: "Every second letter (B, D, F, H…); next is J." },
            { text: "A, Z, B, Y, C, X, ?", options: ["W", "D", "E", "V"], correctIndex: 1, explanation: "A front series A, B, C, D… interleaves with a back series Z, Y, X…; the next front letter is D." },
            { text: "Z, X, V, T, ?", options: ["S", "R", "Q", "U"], correctIndex: 1, explanation: "Backwards, skipping one each time (Z, X, V, T…); next is R." },
            { text: "AB, DE, GH, ?", options: ["JK", "IJ", "KL", "HI"], correctIndex: 0, explanation: "Each pair skips a letter: AB, DE, GH, JK." },
            { text: "B2, D4, F6, H8, ?", options: ["I9", "J9", "K10", "J10"], correctIndex: 3, explanation: "Letters skip one (B, D, F, H, J) and numbers are even (2, 4, 6, 8, 10): J10." },
            { text: "AZ, BY, CX, DW, ?", options: ["EV", "FU", "EW", "FV"], correctIndex: 0, explanation: "First letters go A, B, C, D, E; second letters go Z, Y, X, W, V: EV." },
            { text: "C, F, I, L, ?", options: ["M", "N", "O", "P"], correctIndex: 2, explanation: "Add 3 each time (C, F, I, L…); next is O." },
            { text: "A, B, D, G, K, ?", options: ["O", "P", "Q", "N"], correctIndex: 1, explanation: "The gap grows by one each time (skip 0, 1, 2, 3, 4…): K → P." },
            { text: "Z, W, T, Q, ?", options: ["O", "M", "P", "N"], correctIndex: 3, explanation: "Subtract 3 each time (Z, W, T, Q…); next is N." },
        ],
    },
    {
        slug: "logical-sequence-of-words",
        topic: "Logical Sequence of Words",
        blurb: "Arrange the words into their natural order. Answers reveal as you go.",
        questions: [
            { text: "Arrange in a meaningful order:  1. Seed  2. Plant  3. Flower  4. Fruit  5. Tree", options: ["1, 2, 3, 4, 5", "1, 2, 5, 3, 4", "5, 1, 2, 3, 4", "2, 1, 5, 3, 4"], correctIndex: 1, explanation: "A seed grows into a plant, then a tree, which flowers and finally fruits." },
            { text: "Arrange from smallest to largest:  1. Word  2. Sentence  3. Letter  4. Paragraph  5. Chapter", options: ["3, 1, 2, 4, 5", "1, 3, 2, 4, 5", "3, 1, 2, 5, 4", "1, 2, 3, 4, 5"], correctIndex: 0, explanation: "Letter → Word → Sentence → Paragraph → Chapter." },
            { text: "Arrange by age:  1. Infant  2. Child  3. Adult  4. Old  5. Youth", options: ["1, 2, 3, 5, 4", "1, 2, 3, 4, 5", "2, 1, 5, 3, 4", "1, 2, 5, 3, 4"], correctIndex: 3, explanation: "Infant → Child → Youth → Adult → Old." },
            { text: "Arrange from smallest to largest:  1. District  2. Village  3. State  4. Country  5. Town", options: ["2, 1, 5, 3, 4", "5, 2, 1, 3, 4", "2, 5, 1, 3, 4", "2, 5, 3, 1, 4"], correctIndex: 2, explanation: "Village → Town → District → State → Country." },
            { text: "Arrange in a meaningful order:  1. Dough  2. Wheat  3. Bread  4. Flour  5. Harvest", options: ["2, 5, 4, 1, 3", "2, 4, 5, 1, 3", "2, 5, 1, 4, 3", "5, 2, 4, 1, 3"], correctIndex: 0, explanation: "Wheat → Harvest → Flour → Dough → Bread." },
            { text: "Arrange in a meaningful order:  1. Doctor  2. Illness  3. Medicine  4. Recovery  5. Diagnosis", options: ["1, 2, 5, 3, 4", "2, 1, 5, 3, 4", "2, 1, 3, 5, 4", "2, 5, 1, 3, 4"], correctIndex: 1, explanation: "Illness → Doctor → Diagnosis → Medicine → Recovery." },
            { text: "Arrange in build order:  1. Roof  2. Foundation  3. Furnishing  4. Walls  5. Painting", options: ["2, 1, 4, 5, 3", "2, 4, 1, 3, 5", "4, 2, 1, 5, 3", "2, 4, 1, 5, 3"], correctIndex: 3, explanation: "Foundation → Walls → Roof → Painting → Furnishing." },
            { text: "Arrange in a meaningful order:  1. Consultation  2. Illness  3. Prescription  4. Chemist  5. Cure", options: ["1, 2, 3, 4, 5", "2, 1, 3, 4, 5", "2, 1, 4, 3, 5", "2, 3, 1, 4, 5"], correctIndex: 1, explanation: "Illness → Consultation → Prescription → Chemist → Cure." },
            { text: "Arrange in a meaningful order:  1. Cotton  2. Cloth  3. Thread  4. Shirt", options: ["1, 2, 3, 4", "3, 1, 2, 4", "1, 3, 2, 4", "1, 3, 4, 2"], correctIndex: 2, explanation: "Cotton is spun into Thread, woven into Cloth, then stitched into a Shirt." },
            { text: "Arrange in a meaningful order:  1. Table  2. Tree  3. Wood  4. Seed  5. Plant", options: ["4, 5, 2, 3, 1", "4, 5, 2, 1, 3", "5, 4, 2, 3, 1", "4, 2, 5, 3, 1"], correctIndex: 0, explanation: "Seed → Plant → Tree → Wood → Table." },
        ],
    },
    {
        slug: "coding-and-decoding",
        topic: "Coding & Decoding",
        blurb: "Crack the code, then apply the same rule. Answers reveal as you go.",
        questions: [
            { text: "If CAT is coded as DBU, how is DOG coded?", options: ["EPH", "EPI", "FPH", "DPH"], correctIndex: 0, explanation: "Each letter moves one step forward: C→D, A→B, T→U; so DOG → EPH." },
            { text: "If FRIEND is coded as GSJFOE, how is MOTHER coded?", options: ["NPUIRS", "LNSGDQ", "NQUIFS", "NPUIFS"], correctIndex: 3, explanation: "Each letter is shifted one forward; MOTHER → NPUIFS." },
            { text: "If A = 1, B = 2, …, Z = 26, what is the sum of the letters in CAB?", options: ["5", "7", "6", "4"], correctIndex: 2, explanation: "C = 3, A = 1, B = 2; 3 + 1 + 2 = 6." },
            { text: "In a code PEN → NEP and INK → KNI. How is CUP written?", options: ["UPC", "CPU", "PUC", "PCU"], correctIndex: 2, explanation: "The letters are written in reverse order; CUP → PUC." },
            { text: "If ROSE = 6821 and CHAIR = 73456, how is SEARCH coded?", options: ["216473", "214763", "214673", "241673"], correctIndex: 2, explanation: "S=2, E=1, A=4, R=6, C=7, H=3 → SEARCH = 214673." },
            { text: "If A = 2, B = 4, C = 6 … (twice the position), what is the sum for DAD?", options: ["16", "14", "18", "20"], correctIndex: 2, explanation: "D = 8, A = 2, D = 8; 8 + 2 + 8 = 18." },
            { text: "If DELHI is coded as CDKGH, how is MUMBAI coded?", options: ["LTLAZH", "LTMAZH", "LSLAZH", "LTLZAH"], correctIndex: 0, explanation: "Each letter moves one step back; MUMBAI → LTLAZH." },
            { text: "If EARTH is coded as FBSUI, how is WATER coded?", options: ["XBVFS", "WBUFS", "XBUGS", "XBUFS"], correctIndex: 3, explanation: "Each letter moves one step forward; WATER → XBUFS." },
            { text: "If 5 → 25, 6 → 36 and 7 → 49, then 9 → ?", options: ["72", "90", "81", "99"], correctIndex: 2, explanation: "Each number is squared; 9² = 81." },
            { text: "Using A = 1 … Z = 26, what is the sum of the letters in BOOK?", options: ["43", "41", "45", "42"], correctIndex: 0, explanation: "B = 2, O = 15, O = 15, K = 11; 2 + 15 + 15 + 11 = 43." },
        ],
    },
    {
        slug: "direction-sense-test",
        topic: "Direction Sense Test",
        blurb: "Track the turns and distances to find the final position. Answers reveal as you go.",
        questions: [
            { text: "A man walks North, then turns right. Which direction is he facing now?", options: ["West", "North", "East", "South"], correctIndex: 2, explanation: "Turning right (clockwise) from North makes you face East." },
            { text: "Ravi walks 10 m East, turns left and walks 10 m. How far is he from the start?", options: ["20 m", "10√2 m", "10 m", "14 m"], correctIndex: 1, explanation: "The two legs are perpendicular; distance = √(10² + 10²) = 10√2 m." },
            { text: "A person walks 3 km South, then 4 km East. How far is he from the start?", options: ["5 km", "7 km", "6 km", "4 km"], correctIndex: 0, explanation: "The legs are perpendicular; distance = √(3² + 4²) = 5 km." },
            { text: "Facing North, you turn 90° clockwise, then 90° clockwise again. Which way do you face?", options: ["East", "South", "West", "North"], correctIndex: 1, explanation: "North → East → South after two clockwise quarter-turns." },
            { text: "In the morning, the sun is in the East. Towards which direction does a shadow fall?", options: ["East", "North", "West", "South"], correctIndex: 2, explanation: "With the sun in the East, shadows fall towards the West." },
            { text: "A man walks 6 km North, turns right 3 km, then turns right 6 km. Where is he from the start?", options: ["3 km East", "3 km West", "9 km South", "6 km East"], correctIndex: 0, explanation: "The 6 km North and 6 km South cancel; he ends 3 km to the East." },
            { text: "A person facing North makes a 180° turn. Which direction do they face?", options: ["North", "East", "South", "West"], correctIndex: 2, explanation: "A 180° turn reverses your direction: North → South." },
            { text: "A man walks 4 km West, then 4 km South, then 4 km East. Where is he from the start?", options: ["4 km North", "4 km South", "12 km away", "4 km West"], correctIndex: 1, explanation: "The 4 km West and 4 km East cancel; he ends 4 km South." },
            { text: "At sunset you face the setting sun. Your right hand points towards which direction?", options: ["South", "North", "East", "West"], correctIndex: 1, explanation: "The sun sets in the West; facing West, your right hand points North." },
            { text: "A car goes 8 km North, turns right and goes 6 km. How far is it from the start?", options: ["14 km", "10 km", "12 km", "7 km"], correctIndex: 1, explanation: "The legs are perpendicular; distance = √(8² + 6²) = 10 km." },
        ],
    },
];

// Publish each reasoning Quick Shot once. Attributed to an admin (falling back to
// the earliest user), so it runs after the Super Admin is bootstrapped. Guarded
// per-topic by a SeedFlag, and skips any bank that isn't exactly the locked count.
async function ensureReasoningQuickShotsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[reasoning-qs] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const bank of BANKS) {
            const key = `reasoning-qs-${bank.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            // Locked format safety: never publish a Quick Shot with the wrong count.
            if (bank.questions.length !== QUICK_SHOT.count) {
                console.warn(
                    `[reasoning-qs] ${bank.topic} has ${bank.questions.length} questions, expected ${QUICK_SHOT.count} — skipped`
                );
                continue;
            }

            const docs = await Question.insertMany(
                bank.questions.map((q) => ({
                    ...q,
                    subject: "Reasoning",
                    topic: bank.topic,
                    difficulty: "moderate",
                    marks: 1,
                    createdBy: owner._id,
                }))
            );

            await Test.create({
                title: `Reasoning: ${bank.topic} — Quick Shot`,
                description: bank.blurb,
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
            await SeedFlag.create({ key });
            console.log(`[reasoning-qs] published ${bank.topic} ${QUICK_SHOT.label} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[reasoning-qs] seed skipped:", e.message);
    }
}

module.exports = { BANKS, ensureReasoningQuickShotsSeeded };
