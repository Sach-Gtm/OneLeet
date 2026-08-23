const mongoose = require("mongoose");
const SeedFlag = require("../models/seedFlagModel");

// One-time content cleanup (idempotent boot seed, per CLAUDE.md). The founder
// wants the em dash gone from every piece of student-facing content, so this
// strips it from the string fields of the browsable content collections that
// were seeded in earlier boots (SeedFlag-guarded seeds don't re-run, so a source
// fix alone can't touch already-published docs). Hardcoded client copy, email
// and SEO templates are fixed at their source separately.
//
// NOTE: the em dash is written as its \u2014 escape everywhere below, never as a
// literal character. That is deliberate: a bulk "remove the em dash" pass over
// the source must not be able to rewrite this file's own matching logic (an
// earlier pass did exactly that, turning the match into a hyphen and silently
// breaking the migration).
const SEED_KEY = "strip-em-dashes-v1";
const EM = "\u2014"; // em dash

// Collections whose text students actually read.
const COLLECTIONS = [
    "Course", "Question", "Test", "Exam", "Mentor", "Review", "Note",
    "Syllabus", "Video", "ExamPattern", "Pyq", "CutoffMatrix", "SeatMatrix",
];

// "word <em dash> word" reads best as a comma; a bare/edge em dash becomes a
// hyphen. Only ever touches the em dash, never a normal hyphen.
const deEm = (s) => s.replace(/\s+\u2014\s+/g, ", ").replace(/\s*\u2014\s*/g, "-");

// Recursively rebuild a value with em dashes stripped from every string, leaving
// ObjectIds, Dates, Buffers, numbers and booleans untouched.
function strip(v) {
    if (typeof v === "string") return v.includes(EM) ? deEm(v) : v;
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
        if (v instanceof mongoose.Types.ObjectId || v instanceof Date || Buffer.isBuffer(v)) return v;
        const out = {};
        for (const k of Object.keys(v)) out[k] = strip(v[k]);
        return out;
    }
    return v;
}

async function ensureEmDashesStripped() {
    try {
        if (await SeedFlag.exists({ key: SEED_KEY })) return;
        let cleaned = 0;
        for (const name of COLLECTIONS) {
            let Model;
            try { Model = mongoose.model(name); } catch { continue; } // model not registered
            const cursor = Model.find({}).lean().cursor();
            let ops = [];
            // eslint-disable-next-line no-await-in-loop
            for (let doc = await cursor.next(); doc; doc = await cursor.next()) {
                if (!JSON.stringify(doc).includes(EM)) continue; // nothing to fix
                const fixed = strip(doc);
                delete fixed._id;
                delete fixed.__v;
                ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: fixed } } });
                if (ops.length >= 200) {
                    // eslint-disable-next-line no-await-in-loop
                    await Model.bulkWrite(ops, { ordered: false });
                    cleaned += ops.length;
                    ops = [];
                }
            }
            if (ops.length) {
                // eslint-disable-next-line no-await-in-loop
                await Model.bulkWrite(ops, { ordered: false });
                cleaned += ops.length;
            }
        }
        await SeedFlag.create({ key: SEED_KEY });
        console.log(`[strip-em-dashes] cleaned ${cleaned} content docs`);
    } catch (e) {
        console.warn("[strip-em-dashes] skipped:", e.message);
    }
}

module.exports = { ensureEmDashesStripped, deEm };
