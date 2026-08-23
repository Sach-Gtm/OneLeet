const Test = require("../models/testModel");
const Question = require("../models/questionModel");
const User = require("../models/userModel");
const SeedFlag = require("../models/seedFlagModel");
const { TEST_FORMATS } = require("./testFormats");

// Four more Applied Mathematics chapters — Sets, Matrices & Determinants,
// Sequences & Series and Basic Calculus — each shipped in TWO flavours:
//   • Practice (repeatable, answer + reason reveal as you go)
//   • Graded Test (single-attempt, ranked on a live leaderboard)
// The two flavours use DIFFERENT questions so doing the practice set doesn't
// spoil the graded one. 80 freshly authored, exam-focused questions on standard
// textbook facts / worked numericals (every value checked, answer keys spread
// across the options). Quick Shot format (10 Q), 25-minute window, open to all
// exams (targets: []). Subject "Mathematics" with a per-chapter topic.

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

/* ─────────────── SETS ─────────────── */
const SETS_PRACTICE = [
    q("The set of all vowels in the English alphabet has how many elements?", ["3", "4", "5", "6"], 2, "The vowels are a, e, i, o, u, five elements."),
    q("The number of elements in the empty set ∅ is:", ["Infinite", "1", "2", "0"], 3, "The empty set has no elements, so n(∅) = 0."),
    q("If A = {1, 2, 3}, the number of subsets of A is:", ["6", "8", "9", "3"], 1, "A set with n elements has 2ⁿ subsets; here 2³ = 8."),
    q("If A = {1, 2} and B = {2, 3}, then A ∪ B is:", ["{1, 2}", "{2}", "{1, 2, 3}", "{1, 2, 2, 3}"], 2, "The union collects all distinct elements: {1, 2, 3}."),
    q("If A = {1, 2, 3} and B = {2, 3, 4}, then A ∩ B is:", ["{2, 3}", "{1, 4}", "{1, 2, 3, 4}", "{ }"], 0, "The intersection is the common elements: {2, 3}."),
    q("If n(A) = 3, n(B) = 4 and n(A ∩ B) = 1, then n(A ∪ B) is:", ["7", "6", "8", "5"], 1, "n(A ∪ B) = n(A) + n(B) − n(A ∩ B) = 3 + 4 − 1 = 6."),
    q("The symbol ⊆ denotes:", ["is an element of", "is a subset of", "union", "intersection"], 1, "A ⊆ B means A is a subset of B."),
    q("If A = {a, b, c, d}, then n(A) is:", ["3", "5", "2", "4"], 3, "The set has four elements, so n(A) = 4."),
    q("The set {x : x is a natural number and x < 1} is:", ["{0}", "{1}", "the empty set", "{−1}"], 2, "No natural number is less than 1, so the set is empty."),
    q("The number of proper subsets of a set with 3 elements is:", ["8", "7", "6", "3"], 1, "Proper subsets = 2ⁿ − 1 = 2³ − 1 = 7 (all subsets except the set itself)."),
];
const SETS_TEST = [
    q("A set having no elements is called the:", ["universal set", "empty (null) set", "power set", "singleton set"], 1, "A set with no elements is the empty (null) set."),
    q("If A = {2, 4, 6, 8}, then n(A) is:", ["2", "6", "8", "4"], 3, "The set has four elements, so n(A) = 4."),
    q("If A = {1, 2} and B = {2, 3, 4}, then n(A ∪ B) is:", ["4", "3", "5", "2"], 0, "A ∪ B = {1, 2, 3, 4}, so n(A ∪ B) = 4."),
    q("If A = {1, 2, 3, 4} and B = {3, 4, 5}, then A ∩ B is:", ["{3, 4}", "{1, 2}", "{5}", "{1, 2, 3, 4, 5}"], 0, "The common elements are 3 and 4."),
    q("The number of subsets of a set with 4 elements is:", ["8", "12", "16", "4"], 2, "2⁴ = 16 subsets."),
    q("If n(A) = 5, n(B) = 3 and n(A ∪ B) = 6, then n(A ∩ B) is:", ["1", "3", "8", "2"], 3, "n(A ∩ B) = n(A) + n(B) − n(A ∪ B) = 5 + 3 − 6 = 2."),
    q("The set of all integers is denoted by:", ["N", "Q", "Z", "R"], 2, "Z (from the German 'Zahlen') denotes the integers."),
    q("Two sets A and B are said to be equal if:", ["they have the same number of elements", "one is a subset of the other", "they are both non-empty", "they have exactly the same elements"], 3, "Equal sets contain exactly the same elements."),
    q("If U = {1, 2, 3, 4, 5} and A = {1, 2}, then the complement A′ is:", ["{1, 2}", "{1, 2, 3, 4, 5}", "{ }", "{3, 4, 5}"], 3, "A′ = U − A = {3, 4, 5}."),
    q("The union of any set A with the empty set ∅ is:", ["∅", "the universal set", "A", "{0}"], 2, "Adding nothing changes nothing: A ∪ ∅ = A."),
];

/* ─────────────── MATRICES & DETERMINANTS ─────────────── */
const MATRICES_PRACTICE = [
    q("A matrix having the same number of rows and columns is called a:", ["row matrix", "square matrix", "column matrix", "null matrix"], 1, "Equal rows and columns → a square matrix."),
    q("The order of the matrix [[1, 2, 3], [4, 5, 6]] is:", ["3 × 2", "2 × 3", "6 × 1", "2 × 2"], 1, "It has 2 rows and 3 columns, so the order is 2 × 3."),
    q("A matrix in which every element is zero is called a:", ["identity matrix", "diagonal matrix", "null (zero) matrix", "scalar matrix"], 2, "All-zero entries → a null (zero) matrix."),
    q("The determinant of the 2×2 matrix [[a, b], [c, d]] is:", ["ad − bc", "ab − cd", "ad + bc", "ac − bd"], 0, "For a 2×2 matrix the determinant is ad − bc."),
    q("The value of the determinant |2 3; 1 4| is:", ["11", "−5", "8", "5"], 3, "(2 × 4) − (3 × 1) = 8 − 3 = 5."),
    q("The identity matrix of order 2 is:", ["[[1, 1], [1, 1]]", "[[0, 0], [0, 0]]", "[[1, 0], [0, 1]]", "[[1, 0], [1, 0]]"], 2, "The 2×2 identity has 1s on the diagonal and 0s elsewhere."),
    q("Interchanging the rows and columns of a matrix gives its:", ["transpose", "inverse", "adjoint", "determinant"], 0, "Swapping rows and columns produces the transpose."),
    q("If A has order 2 × 3 and B has order 3 × 2, then the order of the product AB is:", ["3 × 3", "2 × 3", "3 × 2", "2 × 2"], 3, "AB takes the rows of A and columns of B: 2 × 2."),
    q("The value of the determinant |1 2; 3 4| is:", ["−2", "2", "10", "−10"], 0, "(1 × 4) − (2 × 3) = 4 − 6 = −2."),
    q("A square matrix having non-zero entries only on its main diagonal is a:", ["scalar matrix", "triangular matrix", "diagonal matrix", "null matrix"], 2, "Non-zero entries only on the main diagonal → a diagonal matrix."),
];
const MATRICES_TEST = [
    q("The number of elements in a 3 × 3 matrix is:", ["3", "6", "9", "12"], 2, "A 3 × 3 matrix has 3 × 3 = 9 elements."),
    q("The value of the determinant |5 2; 3 1| is:", ["1", "−1", "11", "−11"], 1, "(5 × 1) − (2 × 3) = 5 − 6 = −1."),
    q("Two matrices can be added only if they have the same:", ["order", "determinant", "number of rows only", "first element"], 0, "Matrix addition requires the same order (same rows and columns)."),
    q("The determinant of the identity matrix of order 2 is:", ["0", "2", "4", "1"], 3, "|1 0; 0 1| = (1)(1) − (0)(0) = 1."),
    q("The matrix A = [[1, 0], [0, 1]] is the:", ["null matrix", "row matrix", "scalar 2 matrix", "identity matrix"], 3, "1s on the diagonal, 0s elsewhere → the identity matrix."),
    q("The value of the determinant |3 0; 0 4| is:", ["7", "0", "12", "−12"], 2, "(3 × 4) − (0 × 0) = 12."),
    q("A matrix of order m × n has how many elements?", ["m + n", "m − n", "m/n", "mn"], 3, "m rows × n columns = mn elements."),
    q("The transpose of a 2 × 3 matrix has order:", ["2 × 3", "3 × 2", "2 × 2", "3 × 3"], 1, "Transposing swaps rows and columns, giving 3 × 2."),
    q("The value of the determinant |4 2; 2 1| is:", ["0", "4", "8", "−4"], 0, "(4 × 1) − (2 × 2) = 4 − 4 = 0."),
    q("For the product AB to be defined, the number of columns of A must equal the number of ___ of B:", ["rows", "columns", "elements", "diagonals"], 0, "AB is defined only when columns of A = rows of B."),
];

/* ─────────────── SEQUENCES & SERIES ─────────────── */
const SERIES_PRACTICE = [
    q("In the arithmetic progression 2, 5, 8, 11, …, the common difference is:", ["2", "3", "5", "8"], 1, "Each term exceeds the previous by 3, so d = 3."),
    q("The nth term of an AP with first term a and common difference d is:", ["a + nd", "a − (n − 1)d", "a + (n − 1)d", "an"], 2, "The nth term is aₙ = a + (n − 1)d."),
    q("The 5th term of the AP with first term 2 and common difference 3 is:", ["11", "17", "12", "14"], 3, "a₅ = 2 + (5 − 1) × 3 = 2 + 12 = 14."),
    q("In the geometric progression 3, 6, 12, 24, …, the common ratio is:", ["2", "3", "6", "12"], 0, "Each term is twice the previous, so r = 2."),
    q("The sum of the first n natural numbers is:", ["n(n − 1)/2", "n(n + 1)/2", "n²", "n(n + 1)"], 1, "1 + 2 + … + n = n(n + 1)/2."),
    q("The sum of the first 10 natural numbers is:", ["45", "50", "55", "100"], 2, "10 × 11 / 2 = 55."),
    q("The 4th term of the GP 2, 6, 18, … is:", ["36", "162", "48", "54"], 3, "r = 3, so a₄ = 2 × 3³ = 2 × 27 = 54."),
    q("The arithmetic mean of 8 and 12 is:", ["10", "9", "20", "11"], 0, "(8 + 12)/2 = 20/2 = 10."),
    q("The sum of the first n odd natural numbers is:", ["n(n + 1)", "2n", "n(n − 1)", "n²"], 3, "1 + 3 + 5 + … to n terms = n²."),
    q("The 10th term of the AP 1, 3, 5, 7, … is:", ["17", "19", "21", "20"], 1, "d = 2, so a₁₀ = 1 + 9 × 2 = 19."),
];
const SERIES_TEST = [
    q("In the arithmetic progression 7, 10, 13, 16, …, the common difference is:", ["2", "3", "4", "5"], 1, "Each term exceeds the previous by 3, so d = 3."),
    q("The 6th term of the AP with first term 5 and common difference 4 is:", ["21", "29", "20", "25"], 3, "a₆ = 5 + (6 − 1) × 4 = 5 + 20 = 25."),
    q("In the geometric progression 1, 2, 4, 8, …, the common ratio is:", ["2", "1", "4", "3"], 0, "Each term is twice the previous, so r = 2."),
    q("The sum of the first 5 natural numbers is:", ["10", "20", "15", "25"], 2, "5 × 6 / 2 = 15."),
    q("The nth term of a GP with first term a and common ratio r is:", ["a + (n − 1)r", "a·rⁿ", "a·r^(n − 1)", "a·r^(n + 1)"], 2, "The nth term of a GP is aₙ = a·r^(n − 1)."),
    q("The 4th term of the GP 5, 10, 20, … is:", ["30", "80", "20", "40"], 3, "r = 2, so a₄ = 5 × 2³ = 5 × 8 = 40."),
    q("The geometric mean of 4 and 9 is:", ["6", "6.5", "36", "5"], 0, "GM = √(4 × 9) = √36 = 6."),
    q("The sum of the first 4 odd natural numbers (1 + 3 + 5 + 7) is:", ["12", "16", "20", "8"], 1, "The sum of the first n odd numbers is n²; here 4² = 16."),
    q("The 7th term of the AP 2, 4, 6, 8, … is:", ["12", "10", "14", "16"], 2, "d = 2, so a₇ = 2 + 6 × 2 = 14."),
    q("The sum of an AP with n terms, first term a and last term l is:", ["n(a + l)", "n/2 (a + l)", "n/2 (a − l)", "(a + l)/2"], 1, "Sₙ = n/2 (a + l)."),
];

/* ─────────────── BASIC CALCULUS ─────────────── */
const CALCULUS_PRACTICE = [
    q("The derivative of xⁿ with respect to x is:", ["xⁿ⁺¹/(n + 1)", "n·xⁿ⁻¹", "n·xⁿ", "xⁿ⁻¹"], 1, "By the power rule, d/dx(xⁿ) = n·xⁿ⁻¹."),
    q("The derivative of x² with respect to x is:", ["x", "x²/2", "2", "2x"], 3, "d/dx(x²) = 2x."),
    q("The derivative of a constant is:", ["1", "x", "0", "the constant itself"], 2, "A constant does not change, so its derivative is 0."),
    q("The derivative of x with respect to x is:", ["0", "1", "x", "x²/2"], 1, "d/dx(x) = 1."),
    q("∫xⁿ dx (for n ≠ −1) equals:", ["n·xⁿ⁻¹", "xⁿ/n + C", "xⁿ⁺¹ + C", "xⁿ⁺¹/(n + 1) + C"], 3, "By the power rule for integration, ∫xⁿ dx = xⁿ⁺¹/(n + 1) + C."),
    q("The derivative of x³ with respect to x is:", ["3x²", "x³/3", "3x", "x²"], 0, "d/dx(x³) = 3x²."),
    q("The derivative of sin x with respect to x is:", ["−cos x", "cos x", "−sin x", "sin x"], 1, "d/dx(sin x) = cos x."),
    q("∫x dx equals:", ["x²/2 + C", "x² + C", "1 + C", "2x + C"], 0, "∫x dx = x²/2 + C."),
    q("The derivative of 5x with respect to x is:", ["5x", "0", "5", "x"], 2, "d/dx(5x) = 5."),
    q("∫1 dx equals:", ["1 + C", "0", "x²/2 + C", "x + C"], 3, "∫1 dx = x + C."),
];
const CALCULUS_TEST = [
    q("The derivative of x⁴ with respect to x is:", ["4x³", "x⁵/5", "4x⁴", "x³"], 0, "By the power rule, d/dx(x⁴) = 4x³."),
    q("The derivative of cos x with respect to x is:", ["sin x", "−sin x", "cos x", "−cos x"], 1, "d/dx(cos x) = −sin x."),
    q("∫x² dx equals:", ["2x", "3x² + C", "x³ + C", "x³/3 + C"], 3, "∫x² dx = x³/3 + C."),
    q("The derivative of the constant function f(x) = 7 is:", ["7", "1", "0", "7x"], 2, "The derivative of any constant is 0."),
    q("The derivative of 3x² with respect to x is:", ["3x", "6x", "6x²", "3x²"], 1, "d/dx(3x²) = 3 × 2x = 6x."),
    q("The derivative of eˣ with respect to x is:", ["x·eˣ⁻¹", "eˣ", "x·eˣ", "1"], 1, "eˣ is its own derivative: d/dx(eˣ) = eˣ."),
    q("∫x³ dx equals:", ["3x²", "x⁴ + C", "4x³ + C", "x⁴/4 + C"], 3, "∫x³ dx = x⁴/4 + C."),
    q("The slope of the tangent to a curve y = f(x) at a point is given by:", ["the area under the curve", "∫y dx", "dy/dx at that point", "y at that point"], 2, "The derivative dy/dx gives the slope of the tangent at a point."),
    q("The derivative of (x² + 3x) with respect to x is:", ["2x + 3", "x² + 3", "2x", "2 + 3x"], 0, "Differentiate term by term: 2x + 3."),
    q("∫2x dx equals:", ["2 + C", "2x² + C", "x²/2 + C", "x² + C"], 3, "∫2x dx = 2 × x²/2 + C = x² + C."),
];

const TESTS = [
    // Sets
    { slug: "sets-practice", topic: "Sets", mode: "practice", difficulty: "easy", title: "Applied Maths: Sets, Practice", questions: SETS_PRACTICE, blurb: "10 practice questions on sets, union, intersection, subsets and set-size formulae. Repeatable; the answer reveals as you go. 25-minute window." },
    { slug: "sets-test", topic: "Sets", mode: "test", difficulty: "moderate", title: "Applied Maths: Sets, Graded Test", questions: SETS_TEST, blurb: "A single-attempt, graded 10-question test on sets, ranked on a live leaderboard. 25 minutes. (Different questions from the practice set.)" },
    // Matrices & Determinants
    { slug: "matrices-practice", topic: "Matrices & Determinants", mode: "practice", difficulty: "easy", title: "Applied Maths: Matrices & Determinants, Practice", questions: MATRICES_PRACTICE, blurb: "10 practice questions on matrices and 2×2 determinants, order, types, transpose, product order and evaluating determinants. 25-minute window." },
    { slug: "matrices-test", topic: "Matrices & Determinants", mode: "test", difficulty: "moderate", title: "Applied Maths: Matrices & Determinants, Graded Test", questions: MATRICES_TEST, blurb: "A single-attempt, graded 10-question test on matrices & determinants, ranked on a live leaderboard. 25 minutes." },
    // Sequences & Series
    { slug: "series-practice", topic: "Sequences & Series", mode: "practice", difficulty: "easy", title: "Applied Maths: Sequences & Series, Practice", questions: SERIES_PRACTICE, blurb: "10 practice questions on APs and GPs, nth term, common difference/ratio, sums and means, with worked numericals. 25-minute window." },
    { slug: "series-test", topic: "Sequences & Series", mode: "test", difficulty: "moderate", title: "Applied Maths: Sequences & Series, Graded Test", questions: SERIES_TEST, blurb: "A single-attempt, graded 10-question test on sequences & series, ranked on a live leaderboard. 25 minutes." },
    // Basic Calculus
    { slug: "calculus-practice", topic: "Basic Calculus", mode: "practice", difficulty: "easy", title: "Applied Maths: Basic Calculus, Practice", questions: CALCULUS_PRACTICE, blurb: "10 practice questions on basic calculus, the power rule, standard derivatives and simple integrals. 25-minute window." },
    { slug: "calculus-test", topic: "Basic Calculus", mode: "test", difficulty: "moderate", title: "Applied Maths: Basic Calculus, Graded Test", questions: CALCULUS_TEST, blurb: "A single-attempt, graded 10-question test on basic calculus, ranked on a live leaderboard. 25 minutes." },
];

// Publish each set once (per-test SeedFlag). Practice sets are repeatable;
// "test" sets are single-attempt and graded (no closeAt = lifetime access + a
// live leaderboard). All Quick Shot (10 Q), 25-minute, open to every exam.
async function ensureAppliedMathAdvancedTestsSeeded() {
    try {
        const owner =
            (await User.findOne({ role: { $in: ["superadmin", "admin"] } }).sort({ createdAt: 1 }).select("_id").lean()) ||
            (await User.findOne().sort({ createdAt: 1 }).select("_id").lean());
        if (!owner) {
            console.warn("[applied-math-adv] no user to attribute yet; will publish on a later boot");
            return;
        }

        for (const t of TESTS) {
            const key = `applied-math-adv-${t.slug}-v1`;
            if (await SeedFlag.exists({ key })) continue;

            if (t.questions.length !== TEST_FORMATS["quick-shot"].count) {
                console.warn(`[applied-math-adv] ${t.slug} has ${t.questions.length}, expected 10, skipped`);
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
                    difficulty: t.difficulty,
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
                mode: t.mode,
                durationMinutes: 25,
                targets: [],
                questions: docs.map((d) => d._id),
                totalMarks: docs.length,
                status: "published",
                isPublished: true,
                createdBy: owner._id,
            });
            await SeedFlag.create({ key });
            console.log(`[applied-math-adv] published ${t.title} (${t.mode}, ${docs.length} Q)`);
        }
    } catch (e) {
        console.warn("[applied-math-adv] seed skipped:", e.message);
    }
}

module.exports = {
    SETS_PRACTICE, SETS_TEST,
    MATRICES_PRACTICE, MATRICES_TEST,
    SERIES_PRACTICE, SERIES_TEST,
    CALCULUS_PRACTICE, CALCULUS_TEST,
    TESTS,
    ensureAppliedMathAdvancedTestsSeeded,
};
