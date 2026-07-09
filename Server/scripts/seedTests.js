/* Seeds sample mock tests (and their questions) so the Tests feature is usable
 * immediately. Run with:  npm run seed:tests   (from the Server folder)
 * Idempotent: skips if tests already exist (pass --force to add anyway).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/userModel");
const Question = require("../src/models/questionModel");
const Test = require("../src/models/testModel");

const TESTS = [
    {
        title: "Digital Electronics – Quick Test",
        description: "Warm-up on logic gates, flip-flops and number systems.",
        subject: "Digital Electronics",
        category: "subject-wise",
        durationMinutes: 15,
        questions: [
            { text: "A JK flip-flop with J = 1 and K = 1 will:", options: ["Set", "Reset", "Toggle", "Hold the state"], correctIndex: 2, difficulty: "moderate", explanation: "J=K=1 toggles the output on each clock edge." },
            { text: "How many select lines does an 8:1 multiplexer need?", options: ["2", "3", "4", "8"], correctIndex: 1, difficulty: "easy", explanation: "2^n = 8 ⇒ n = 3 select lines." },
            { text: "Which of these is a universal gate?", options: ["AND", "OR", "NAND", "XOR"], correctIndex: 2, difficulty: "easy", explanation: "NAND (and NOR) can implement any boolean function." },
            { text: "The decimal equivalent of binary 1011 is:", options: ["9", "11", "13", "15"], correctIndex: 1, difficulty: "easy", explanation: "8 + 0 + 2 + 1 = 11." },
            { text: "A full adder adds how many input bits?", options: ["1", "2", "3", "4"], correctIndex: 2, difficulty: "moderate", explanation: "Two operand bits plus a carry-in = 3." },
        ],
    },
    {
        title: "Engineering Mathematics Mock",
        description: "Calculus and linear algebra fundamentals.",
        subject: "Mathematics",
        category: "subject-wise",
        durationMinutes: 20,
        questions: [
            { text: "The derivative of sin(x) with respect to x is:", options: ["cos x", "−cos x", "−sin x", "tan x"], correctIndex: 0, difficulty: "easy" },
            { text: "The value of the integral of x dx from 0 to 1 is:", options: ["0", "1/2", "1", "2"], correctIndex: 1, difficulty: "moderate", explanation: "∫x dx = x²/2, evaluated 0→1 = 1/2." },
            { text: "The determinant of a 2×2 identity matrix is:", options: ["0", "1", "2", "−1"], correctIndex: 1, difficulty: "easy" },
            { text: "The rank of a non-singular 3×3 matrix is:", options: ["1", "2", "3", "0"], correctIndex: 2, difficulty: "moderate" },
            { text: "The eigenvalues of a 2×2 identity matrix are:", options: ["0, 0", "1, 1", "2, 2", "−1, −1"], correctIndex: 1, difficulty: "hard" },
        ],
    },
    {
        title: "Physics Fundamentals",
        description: "Mechanics and thermodynamics basics.",
        subject: "Physics",
        category: "subject-wise",
        durationMinutes: 15,
        questions: [
            { text: "The SI unit of force is the:", options: ["Joule", "Newton", "Watt", "Pascal"], correctIndex: 1, difficulty: "easy" },
            { text: "Acceleration due to gravity near Earth's surface is approximately:", options: ["9.8 m/s²", "10.8 m/s²", "8.9 m/s²", "98 m/s²"], correctIndex: 0, difficulty: "easy" },
            { text: "Newton's second law can be written as F =", options: ["m / a", "m·a", "m + a", "a / m"], correctIndex: 1, difficulty: "easy" },
            { text: "The first law of thermodynamics is a statement of the conservation of:", options: ["Energy", "Momentum", "Charge", "Mass only"], correctIndex: 0, difficulty: "moderate" },
            { text: "Work done by a force acting perpendicular to displacement is:", options: ["Maximum", "Zero", "Negative", "Infinite"], correctIndex: 1, difficulty: "moderate", explanation: "W = F·d·cos(90°) = 0." },
        ],
    },
];

(async () => {
    const force = process.argv.includes("--force");
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Add it to Server/.env first.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await Test.countDocuments();
    if (existing > 0 && !force) {
        console.log(`${existing} test(s) already exist — skipping. Use --force to add anyway.`);
        await mongoose.disconnect();
        return;
    }

    let teacher = await User.findOne({ email: "demo-teacher@oneleet.in" });
    if (!teacher) {
        teacher = await User.create({
            name: "OneLeet Faculty",
            email: "demo-teacher@oneleet.in",
            password: "changeme123",
            role: "teacher",
        });
        console.log("Created demo teacher (demo-teacher@oneleet.in / changeme123)");
    }

    for (const t of TESTS) {
        const created = await Question.insertMany(
            t.questions.map((q) => ({ ...q, subject: t.subject, marks: 1, createdBy: teacher._id }))
        );
        await Test.create({
            title: t.title,
            description: t.description,
            subject: t.subject,
            category: t.category,
            durationMinutes: t.durationMinutes,
            questions: created.map((q) => q._id),
            totalMarks: created.length,
            createdBy: teacher._id,
        });
        console.log(`Created test "${t.title}" with ${created.length} questions.`);
    }

    await mongoose.disconnect();
    console.log("Done.");
})().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
});
