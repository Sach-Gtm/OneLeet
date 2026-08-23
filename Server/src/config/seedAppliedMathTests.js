const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Applied Mathematics practice sets for the LEET exam — four chapter-wise Quick
// Shots (10 Q each) on the easier, high-yield counting/stats topics:
//   Probability · Permutations · Combinations · Statistics.
// Freshly authored, exam-focused questions on standard textbook facts and
// worked-out numericals (every value below is checked). Published as repeatable
// "practice" mode (the answer + reason reveal as you go), open to ALL exams
// (targets: []), with a 25-minute window per 10-question set.

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

// ── Probability (10) ──
const PROBABILITY = [
    q("A fair coin is tossed once. The probability of getting a head is:", ["1/2", "1/4", "1", "1/3"], 0, "A coin has two equally likely outcomes, so P(head) = 1/2."),
    q("A fair die is thrown once. The probability of getting a number greater than 4 is:", ["1/2", "1/3", "1/6", "2/3"], 1, "Favourable outcomes are 5 and 6, so P = 2/6 = 1/3."),
    q("A card is drawn at random from a well-shuffled pack of 52 cards. The probability that it is a king is:", ["1/4", "1/26", "1/13", "4/13"], 2, "There are 4 kings, so P = 4/52 = 1/13."),
    q("A bag contains 3 red and 2 green balls. One ball is drawn at random. The probability that it is green is:", ["3/5", "1/5", "2/3", "2/5"], 3, "P(green) = 2/(3+2) = 2/5."),
    q("Two fair coins are tossed together. The probability of getting exactly two heads is:", ["1/4", "1/2", "1/3", "3/4"], 0, "The sample space is {HH, HT, TH, TT}; only HH is favourable, so P = 1/4."),
    q("The probability of an impossible event is:", ["1", "0.5", "0", "−1"], 2, "An impossible event never occurs, so its probability is 0."),
    q("If P(A) = 0.35, then P(not A) is:", ["0.35", "0.65", "1.35", "0.5"], 1, "P(not A) = 1 − P(A) = 1 − 0.35 = 0.65."),
    q("A fair die is thrown once. The probability of getting an even number is:", ["1/3", "1/6", "1/2", "2/3"], 2, "Even outcomes are 2, 4, 6, so P = 3/6 = 1/2."),
    q("A number is chosen at random from 1 to 10. The probability that it is a multiple of 3 is:", ["3/10", "1/3", "1/10", "2/5"], 0, "Multiples of 3 are 3, 6, 9, so P = 3/10."),
    q("Two fair dice are thrown together. The probability of getting a sum of 7 is:", ["1/12", "1/6", "1/9", "5/36"], 1, "Six of the 36 outcomes give a sum of 7 [(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)], so P = 6/36 = 1/6."),
];

// ── Permutations (10) ──
const PERMUTATIONS = [
    q("The number of permutations of n different things taken r at a time (ⁿPᵣ) is:", ["n!/(n − r)!", "n!/(r!(n − r)!)", "n!/r!", "(n − r)!/n!"], 0, "ⁿPᵣ = n!/(n − r)!, arrangements, where order matters."),
    q("The value of 5! is:", ["25", "60", "20", "120"], 3, "5! = 5 × 4 × 3 × 2 × 1 = 120."),
    q("The value of 0! is:", ["0", "1", "Undefined", "10"], 1, "By definition, 0! = 1."),
    q("The number of ways in which the letters of the word CAT can be arranged is:", ["3", "9", "6", "27"], 2, "All 3 letters are distinct, so the count is 3! = 6."),
    q("The value of ⁵P₂ is:", ["20", "10", "25", "15"], 0, "⁵P₂ = 5!/3! = 5 × 4 = 20."),
    q("The value of ⁶P₃ is:", ["18", "216", "20", "120"], 3, "⁶P₃ = 6 × 5 × 4 = 120."),
    q("The number of ways to arrange 4 different books in a row on a shelf is:", ["12", "24", "16", "64"], 1, "4 distinct books → 4! = 24 arrangements."),
    q("The value of ⁿPₙ is:", ["n", "(n − 1)!", "n!", "1"], 2, "ⁿPₙ = n!/(n − n)! = n!/0! = n!."),
    q("How many 3-digit numbers can be formed from the digits 1, 2, 3, 4, 5 without repetition?", ["125", "243", "20", "60"], 3, "⁵P₃ = 5 × 4 × 3 = 60 (order matters, no repetition)."),
    q("The number of distinct arrangements of the letters of the word APPLE is:", ["120", "60", "24", "30"], 1, "5 letters with P repeated twice → 5!/2! = 120/2 = 60."),
];

// ── Combinations (10) ──
const COMBINATIONS = [
    q("The number of combinations of n different things taken r at a time (ⁿCᵣ) is:", ["n!/(r!(n − r)!)", "n!/(n − r)!", "n!/r!", "r!/n!"], 0, "ⁿCᵣ = n!/(r!(n − r)!), selections, where order does not matter."),
    q("The value of ⁿC₀ is:", ["0", "n", "1", "n!"], 2, "There is exactly one way to choose nothing, so ⁿC₀ = 1."),
    q("The value of ⁿCₙ is:", ["n", "1", "0", "n!"], 1, "There is exactly one way to choose all n items, so ⁿCₙ = 1."),
    q("The value of ⁵C₂ is:", ["20", "25", "5", "10"], 3, "⁵C₂ = (5 × 4)/(2 × 1) = 20/2 = 10."),
    q("The value of ⁶C₃ is:", ["120", "18", "20", "216"], 2, "⁶C₃ = (6 × 5 × 4)/(3 × 2 × 1) = 120/6 = 20."),
    q("Using ⁿCᵣ = ⁿCₙ₋ᵣ, the value of ¹⁰C₈ is:", ["80", "90", "45", "20"], 2, "¹⁰C₈ = ¹⁰C₂ = (10 × 9)/2 = 45."),
    q("In how many ways can a committee of 4 be selected from 6 people?", ["30", "15", "360", "20"], 1, "⁶C₄ = ⁶C₂ = (6 × 5)/2 = 15."),
    q("The value of ⁿC₁ is:", ["1", "n!", "n", "0"], 2, "There are n ways to choose a single item, so ⁿC₁ = n."),
    q("The value of ⁷C₂ is:", ["14", "49", "42", "21"], 3, "⁷C₂ = (7 × 6)/(2 × 1) = 42/2 = 21."),
    q("The value of ⁴C₂ is:", ["12", "6", "8", "4"], 1, "⁴C₂ = (4 × 3)/(2 × 1) = 12/2 = 6."),
];

// ── Statistics (10) ──
const STATISTICS = [
    q("The arithmetic mean of 2, 4, 6, 8 and 10 is:", ["5", "7", "8", "6"], 3, "Mean = (2 + 4 + 6 + 8 + 10)/5 = 30/5 = 6."),
    q("The median of the data 3, 5, 7, 9, 11 is:", ["5", "9", "7", "6"], 2, "For 5 ordered values the median is the middle (3rd) value = 7."),
    q("The mode of the data 2, 3, 3, 4, 5, 3 is:", ["2", "3", "4", "5"], 1, "The mode is the most frequently occurring value, which is 3."),
    q("The range of the data 4, 8, 15, 16, 23 is:", ["19", "23", "27", "4"], 0, "Range = largest − smallest = 23 − 4 = 19."),
    q("The mean of the first five natural numbers (1, 2, 3, 4, 5) is:", ["2.5", "5", "15", "3"], 3, "Mean = (1 + 2 + 3 + 4 + 5)/5 = 15/5 = 3."),
    q("The median of the data 2, 4, 6, 8 is:", ["4", "6", "5", "8"], 2, "For an even count the median is the average of the two middle values = (4 + 6)/2 = 5."),
    q("The arithmetic mean of the two numbers 12 and 18 is:", ["30", "15", "6", "16"], 1, "Mean = (12 + 18)/2 = 30/2 = 15."),
    q("The measure of central tendency that is most affected by extreme values is the:", ["Median", "Mode", "Range", "Mean"], 3, "The mean uses every value, so it is pulled by extreme (outlier) values; the median and mode are not."),
    q("The mode of the data 7, 8, 9, 8, 10, 8, 11 is:", ["7", "8", "9", "10"], 1, "8 occurs three times, more than any other value, so the mode is 8."),
    q("The median of the data 10, 20, 30, 40, 50 is:", ["20", "25", "30", "40"], 2, "The middle (3rd) value of the 5 ordered numbers is 30."),
];

const TESTS = [
    { slug: "probability", topic: "Probability", title: "Applied Maths: Probability, Practice", questions: PROBABILITY, blurb: "10 practice questions on probability, coins, dice, cards and simple events. LEET exam-focused; the answer reveals as you go. 25-minute window." },
    { slug: "permutations", topic: "Permutations", title: "Applied Maths: Permutations, Practice", questions: PERMUTATIONS, blurb: "10 practice questions on permutations, ⁿPᵣ, factorials and arrangement counting where order matters. 25-minute window." },
    { slug: "combinations", topic: "Combinations", title: "Applied Maths: Combinations, Practice", questions: COMBINATIONS, blurb: "10 practice questions on combinations, ⁿCᵣ, selections and committee-style counting where order doesn't matter. 25-minute window." },
    { slug: "statistics", topic: "Statistics", title: "Applied Maths: Statistics, Practice", questions: STATISTICS, blurb: "10 practice questions on statistics, mean, median, mode and range, with worked numericals. 25-minute window." },
];

// Publish each set once (per-test SeedFlag), as repeatable practice attributed
// to an admin. Locked to the Quick Shot format (10 Q), 25-minute window, open to
// every exam (targets: []).
async function ensureAppliedMathTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[applied-math] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `applied-math-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            // Quick Shot locks to exactly 10 questions.
            if (t.questions.length !== TEST_FORMATS["quick-shot"].count) {
                console.warn(`[applied-math] ${t.topic} has ${t.questions.length}, expected 10, skipped`);
                continue;
            }

            const docs = await Question.insertMany(
                t.questions.map((qq) => ({
                    text: qq.text,
                    options: [...qq.options],
                    correctIndex: qq.correctIndex,
                    explanation: qq.explanation,
                    subject: "Mathematics",
                    topic: t.topic,
                    difficulty: "easy",
                    marks: 1,
                    createdBy: owner._id,
                }))
            );
            await Test.create({
                title: t.title,
                description: t.blurb,
                subject: "Mathematics",
                topic: t.topic,
                category: "topic-wise",
                format: "quick-shot",
                mode: "practice",
                durationMinutes: 25,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[applied-math] published ${t.title} (${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[applied-math] seed skipped:", e.message);
    }
}

module.exports = { PROBABILITY, PERMUTATIONS, COMBINATIONS, STATISTICS, TESTS, ensureAppliedMathTestsSeeded };
