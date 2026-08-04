const mongoose = require("mongoose");

// One category's closing/opening rank for a branch in a round.
const CellSchema = new mongoose.Schema(
    {
        code: { type: String, trim: true, maxlength: 20 }, // raw IPU code (kept for reference)
        min: { type: Number },                             // opening rank (best admitted)
        max: { type: Number },                             // closing rank (last admitted)
    },
    { _id: false }
);

const CutBranchSchema = new mongoose.Schema(
    {
        branch: { type: String, trim: true, maxlength: 240 },
        cells: { type: [CellSchema], default: [] },
    },
    { _id: false }
);

const CutCollegeSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 240 },
        city: { type: String, trim: true, maxlength: 120 },
        branches: { type: [CutBranchSchema], default: [] },
    },
    { _id: false }
);

const RoundSchema = new mongoose.Schema(
    {
        round: { type: Number },
        label: { type: String, trim: true, maxlength: 40 },
        colleges: { type: [CutCollegeSchema], default: [] },
    },
    { _id: false }
);

// Round-wise counseling cut-offs (closing/opening ranks) for one exam, grouped
// by round → college → branch → category. The `legend` decodes the raw IPU
// category codes into full-form labels + region so students see plain language.
// Its own collection (like SeatMatrix) because there are hundreds of rank cells.
const CutoffMatrixSchema = new mongoose.Schema(
    {
        examCode: { type: String, required: true, unique: true, trim: true, index: true },
        examName: { type: String, trim: true, maxlength: 140 },
        session: { type: String, trim: true, maxlength: 40 },
        audience: { type: String, trim: true, maxlength: 200 },
        source: { type: String, trim: true, maxlength: 300 },
        note: { type: String, trim: true, maxlength: 1200 },

        // code -> { label, region } so the UI can show full forms.
        legend: [
            {
                _id: false,
                code: { type: String, trim: true, maxlength: 20 },
                label: { type: String, trim: true, maxlength: 80 },
                region: { type: String, trim: true, maxlength: 40 },
            },
        ],

        rounds: { type: [RoundSchema], default: [] },

        totalRounds: { type: Number, default: 0 },
        published: { type: Boolean, default: true, index: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CutoffMatrix", CutoffMatrixSchema);
