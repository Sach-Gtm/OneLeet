const mongoose = require("mongoose");

// One branch/programme's seats at a college, split into the buckets a lateral-
// entry aspirant cares about: open counseling seats and Management-Quota seats.
// (This official IPU intake notice does not publish a caste-wise SC/ST/OBC/EWS
// split or a separate donation figure, so `reservations` / `mqBreakdown` are
// kept for when a reservation-wise sheet is available and are otherwise empty.)
const BranchSeatSchema = new mongoose.Schema(
    {
        branch: { type: String, trim: true, maxlength: 120 },      // short, e.g. "CSE"
        branchLong: { type: String, trim: true, maxlength: 240 },  // full programme name
        total: { type: Number, min: 0, default: 0 },               // all seats
        general: { type: Number, min: 0, default: 0 },             // open counseling seats
        mq: { type: Number, min: 0, default: 0 },                  // Management Quota seats
        // Optional finer splits (empty for the IPU 2026-27 notice).
        reservations: [
            {
                _id: false,
                label: { type: String, trim: true, maxlength: 40 },
                seats: { type: Number, min: 0, default: 0 },
            },
        ],
        mqBreakdown: [
            {
                _id: false,
                label: { type: String, trim: true, maxlength: 40 },
                seats: { type: Number, min: 0, default: 0 },
            },
        ],
    },
    { _id: false }
);

const CollegeSeatSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 240 },
        city: { type: String, trim: true, maxlength: 120 },
        branches: { type: [BranchSeatSchema], default: [] },
    },
    { _id: false }
);

// A full seat-intake matrix for one exam (e.g. IPU LEET), grouped by college and
// then branch. Kept in its own collection (not embedded in ExamPattern) because
// a single exam can carry 100+ college×branch rows. Matched to a student by
// `examCode` — the same code they pick in their profile — so students who chose
// that exam can open its seat matrix from the exam-pattern page.
const SeatMatrixSchema = new mongoose.Schema(
    {
        examCode: { type: String, required: true, unique: true, trim: true, index: true },
        examName: { type: String, trim: true, maxlength: 140 },
        session: { type: String, trim: true, maxlength: 40 },       // "2026-27"
        audience: { type: String, trim: true, maxlength: 200 },     // who these seats are for
        source: { type: String, trim: true, maxlength: 300 },       // notification reference
        note: { type: String, trim: true, maxlength: 1200 },        // how to read the categories

        colleges: { type: [CollegeSeatSchema], default: [] },

        // Denormalised totals for the summary header (kept in sync by the seed/edit).
        totalSeats: { type: Number, default: 0 },
        totalColleges: { type: Number, default: 0 },
        totalBranches: { type: Number, default: 0 },

        published: { type: Boolean, default: true, index: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SeatMatrix", SeatMatrixSchema);
