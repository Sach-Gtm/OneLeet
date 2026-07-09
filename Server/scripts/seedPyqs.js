/* Seeds sample PYQ papers so the archive is usable before you upload real
 * papers. Run with:  npm run seed:pyqs   (from the Server folder)
 *
 * Idempotent: if any PYQs already exist it does nothing (pass --force to add
 * the samples anyway). These are metadata-only sample papers (no PDF) — upload
 * real PDFs via the teacher upload, or attach them later.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/userModel");
const Pyq = require("../src/models/pyqModel");

const SAMPLES = [
    { title: "LEET 2023 – CSE", year: 2023, stateExam: "Haryana LEET", branch: "Computer Science", subject: "Digital Electronics", topic: "Digital Logic Design", difficulty: "moderate", tag: "conceptual" },
    { title: "IPU CET 2022", year: 2022, stateExam: "Delhi CET", branch: "Computer Science", subject: "Mathematics", topic: "Applied Mathematics", difficulty: "hard", tag: "numerical" },
    { title: "P.U. LEET 2023", year: 2023, stateExam: "Punjab LEET", branch: "Mechanical", subject: "Mechanics", topic: "Basics of Mechanics", difficulty: "easy", tag: "theory" },
    { title: "UP CET 2021", year: 2021, stateExam: "UP CET", branch: "Computer Science", subject: "C Programming", topic: "C Programming", difficulty: "moderate", tag: "conceptual" },
    { title: "SLIET SET 2022", year: 2022, stateExam: "All India", branch: "Electrical", subject: "Digital Electronics", topic: "Electrical Circuits", difficulty: "hard", tag: "numerical" },
    { title: "Rajasthan LEEP 2023", year: 2023, stateExam: "Rajasthan LEEP", branch: "Electronics", subject: "Physics", topic: "Engineering Physics", difficulty: "moderate", tag: "theory" },
    { title: "Delhi CET 2024 – CSE", year: 2024, stateExam: "Delhi CET", branch: "Computer Science", subject: "Digital Electronics", topic: "Sequential Circuits", difficulty: "hard", tag: "conceptual" },
    { title: "Haryana LEET 2022", year: 2022, stateExam: "Haryana LEET", branch: "Civil", subject: "Mathematics", topic: "Calculus", difficulty: "moderate", tag: "numerical" },
    { title: "Punjab LEET 2021", year: 2021, stateExam: "Punjab LEET", branch: "Mechanical", subject: "Physics", topic: "Thermodynamics", difficulty: "easy", tag: "theory" },
    { title: "UP CET 2023 – ECE", year: 2023, stateExam: "UP CET", branch: "Electronics", subject: "Digital Electronics", topic: "Logic Families", difficulty: "moderate", tag: "conceptual" },
    { title: "All India LEET 2024", year: 2024, stateExam: "All India", branch: "Computer Science", subject: "Mathematics", topic: "Linear Algebra", difficulty: "hard", tag: "numerical" },
    { title: "Rajasthan LEEP 2022", year: 2022, stateExam: "Rajasthan LEEP", branch: "Electrical", subject: "Mechanics", topic: "Statics & Dynamics", difficulty: "moderate", tag: "theory" },
];

(async () => {
    const force = process.argv.includes("--force");
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Add it to Server/.env first.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await Pyq.countDocuments();
    if (existing > 0 && !force) {
        console.log(`${existing} PYQ(s) already exist — skipping. Use --force to add samples anyway.`);
        await mongoose.disconnect();
        return;
    }

    // Ensure a demo teacher to own the seeded papers.
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

    const docs = SAMPLES.map((s) => ({ ...s, uploadedBy: teacher._id }));
    await Pyq.insertMany(docs);
    console.log(`Inserted ${docs.length} sample PYQ papers.`);

    await mongoose.disconnect();
    console.log("Done.");
})().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
});
