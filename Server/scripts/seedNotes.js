/* Seeds sample study notes so the Notes library is usable before you upload
 * real notes. Run with:  npm run seed:notes   (from the Server folder)
 *
 * Idempotent: does nothing if notes already exist (pass --force to add anyway).
 * Metadata-only samples (no PDF) — upload real PDFs via the teacher upload.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/userModel");
const Note = require("../src/models/noteModel");

const SAMPLES = [
    { title: "Digital Logic – Flip Flops & Latches", subject: "Digital Electronics", teacher: "Prof. R.K. Gupta", branch: "CSE", level: "2nd Year", difficulty: "intermediate", format: "pdf", description: "Detailed explanation of SR, JK, D and T flip-flops with timing diagrams and truth tables." },
    { title: "Newton's Laws of Motion – Comprehensive Guide", subject: "Physics", teacher: "Dr. S. Verma", branch: "Common", level: "1st Year", difficulty: "beginner", format: "pdf", description: "A complete breakdown of the three laws of motion with real-world engineering examples and free body diagrams." },
    { title: "Data Structures: Trees & Graphs", subject: "Programming", teacher: "Eng. Priya Singh", branch: "CSE", level: "3rd Year", difficulty: "advanced", format: "slides", description: "Concepts of Binary Trees, AVL Trees, and Graph traversal algorithms (BFS/DFS) with C++ code snippets." },
    { title: "Thermodynamics: Laws & Cycles", subject: "Mechanics", teacher: "Prof. A. Mehta", branch: "MECH", level: "2nd Year", difficulty: "advanced", format: "pdf", description: "Understanding the First and Second Law of Thermodynamics, Carnot Cycle, and Entropy calculations." },
    { title: "Matrices and Determinants", subject: "Mathematics", teacher: "Dr. K.L. Rao", branch: "Common", level: "1st Year", difficulty: "intermediate", format: "handwritten", description: "Eigenvalues, Eigenvectors, and diagonalization of matrices. Includes previous year questions." },
    { title: "C Programming – Pointers & Memory", subject: "Programming", teacher: "Eng. Vikram", branch: "CSE", level: "1st Year", difficulty: "intermediate", format: "pdf", description: "Pointers, dynamic memory allocation, and common pitfalls with worked examples." },
    { title: "Boolean Algebra & K-Maps", subject: "Digital Electronics", teacher: "Prof. R.K. Gupta", branch: "ECE", level: "2nd Year", difficulty: "beginner", format: "slides", description: "Simplifying boolean expressions using K-maps and boolean identities." },
    { title: "Rotational Dynamics", subject: "Physics", teacher: "Dr. Anjali", branch: "Common", level: "1st Year", difficulty: "advanced", format: "handwritten", description: "Moment of inertia, torque, angular momentum and rolling motion with solved problems." },
];

(async () => {
    const force = process.argv.includes("--force");
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Add it to Server/.env first.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await Note.countDocuments({ category: "notes" });
    if (existing > 0 && !force) {
        console.log(`${existing} note(s) already exist — skipping. Use --force to add samples anyway.`);
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

    await Note.insertMany(SAMPLES.map((s) => ({ ...s, category: "notes", uploadedBy: teacher._id })));
    console.log(`Inserted ${SAMPLES.length} sample notes.`);

    await mongoose.disconnect();
    console.log("Done.");
})().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
});
